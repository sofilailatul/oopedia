<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\ClassModel;
use App\Models\UserModel;
use App\Models\UserProgressModel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class ClassController extends Controller
{
    // Halaman Inertia untuk mengelola kelas (dipakai Dosen & Superadmin)
    public function manageIndex(Request $request)
    {
        $user = $request->user();

        $classes = ClassModel::with(['lecturer'])
            ->withCount('users')
            ->latest()
            ->get(['id', 'class_name', 'class_code', 'description', 'created_at', 'created_by']);

        $lecturers = [];
        $role = strtolower($user->role ?? '');
        if ($role === 'superadmin') {
            // Ambil semua user yang rolenya dosen (baik dari kolom role maupun Spatie roles)
            $lecturers = UserModel::query()
                ->where('role', 'dosen')
                ->orWhereHas('roles', function ($q) {
                    $q->where('name', 'dosen');
                })
                ->orderBy('nama')
                ->get(['id', 'nama', 'email']);
        }

        return Inertia::render('ManageClasses/Index', [
            'classes' => $classes,
            'authUser' => $user,
            'lecturers' => $lecturers,
        ]);
    }

    // DOSEN: list classes
    public function index()
    {
        return response()->json(ClassModel::latest()->paginate(20));
    }

    public function show($class)
    {
        $class = ClassModel::with(['users', 'materials'])->findOrFail($class);
        return response()->json($class);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'class_name' => ['required','string','max:255'],
            'class_code' => ['required','string','max:10','unique:classes,class_code'],
            'description' => ['nullable','string'],
            'lecturer_id' => ['nullable','integer','exists:users,id'],
        ]);

        // normalisasi kode ke huruf besar
        $code = strtoupper(trim($data['class_code']));

        $role = strtolower($user->role ?? '');

        $createdBy = $user->id;
        if ($role === 'superadmin' && !empty($data['lecturer_id'])) {
            // Pastikan lecturer_id benar-benar dosen
            $lecturer = UserModel::where('role', 'dosen')->findOrFail($data['lecturer_id']);
            $createdBy = $lecturer->id;
        }

        $class = ClassModel::create([
            'class_name' => $data['class_name'],
            'class_code' => $code,
            'description' => $data['description'] ?? null,
            'created_by' => $createdBy,
        ]);

        return response()->json($class, 201);
    }

    public function update(Request $request, $class)
    {
        $class = ClassModel::findOrFail($class);

        $data = $request->validate([
            'class_name' => ['sometimes','required','string','max:255'],
            'class_code' => ['sometimes','required','string','max:10', Rule::unique('classes', 'class_code')->ignore($class->id)],
            'description' => ['sometimes','nullable','string'],
        ]);

        if (array_key_exists('class_code', $data)) {
            $data['class_code'] = strtoupper(trim($data['class_code']));
        }

        $class->update($data);

        return response()->json($class);
    }

    public function destroy($class)
    {
        $class = ClassModel::findOrFail($class);
        $class->delete();

        return response()->json(['message' => 'deleted']);
    }

    public function join(Request $request)
    {
        try {
            $user = $request->user();

            // Validasi input
            $data = $request->validate([
                'class_code' => ['required', 'string', 'max:10'],
            ]);

            $classCode = strtoupper($data['class_code']);

            // 1. Cari kelas berdasarkan class_code
            $class = ClassModel::where('class_code', $classCode)->first();

            if (!$class) {
                // Inertia expects back() with errors, not JSON
                return back()->withErrors([
                    'class_code' => 'Kode kelas tidak ditemukan. Periksa kembali kode yang Anda masukkan.'
                ]);
            }

            // 2. Cek apakah user sudah join kelas ini
            $already = $class->users()->where('users.id', $user->id)->exists();

            if ($already) {
                return back()->withErrors([
                    'class_code' => 'Anda sudah terdaftar di kelas ini.'
                ]);
            }

            // 3. Mulai transaction untuk atomicity
            DB::beginTransaction();

            try {
                // 4. Attach user ke kelas (many-to-many relationship)
                $class->users()->attach($user->id, [
                    'joined_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // 5. Update role user dari 'tamu' menjadi 'mahasiswa'
                if ($user->role === 'tamu') {
                    $user->update(['role' => 'mahasiswa']);
                }

                // 6. Init progress untuk semua materi di kelas ini
                // Materi pertama unlocked, sisanya locked
                $materials = $class->materials()
                    ->orderBy('materials.order_number')
                    ->get();

                foreach ($materials as $idx => $mat) {
                    UserProgressModel::updateOrCreate(
                        [
                            'user_id' => $user->id,
                            'material_id' => $mat->id,
                            'class_id' => $class->id,
                        ],
                        [
                            'status' => $idx === 0 ? 'unlocked' : 'locked',
                            'is_unlocked' => $idx === 0,
                            'completed_at' => null,
                            'read_at' => null,
                        ]
                    );
                }

                DB::commit();

                // 7. Log success
                Log::info('User joined class successfully', [
                    'user_id' => $user->id,
                    'class_id' => $class->id,
                    'class_code' => $classCode,
                    'materials_initialized' => $materials->count()
                ]);

                // 8. Redirect dengan success message
                return redirect()->route('dashboard')->with('success', 
                    "🎉 Selamat! Anda berhasil bergabung dengan kelas {$class->class_name}. Selamat belajar!"
                );

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            // Validation error - return back dengan errors
            return back()->withErrors($e->errors())->withInput();

        } catch (\Exception $e) {
            // General error
            Log::error('Error joining class', [
                'user_id' => $request->user()->id ?? null,
                'class_code' => $request->class_code ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return back()->withErrors([
                'class_code' => 'Terjadi kesalahan saat bergabung dengan kelas. Silakan coba lagi.'
            ]);
        }
    }
}
