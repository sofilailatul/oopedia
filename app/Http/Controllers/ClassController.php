<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\ClassModel;
use App\Models\UserProgressModel;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ClassController extends Controller
{
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
        $data = $request->validate([
            'class_name' => ['required','string','max:255'],
            'description' => ['nullable','string'],
        ]);

        // bikin kode unik (6-8 chars)
        do {
            $code = strtoupper(Str::random(6));
        } while (ClassModel::where('class_code', $code)->exists());

        $class = ClassModel::create([
            'class_name' => $data['class_name'],
            'class_code' => $code,
            'description' => $data['description'] ?? null,
        ]);

        return response()->json($class, 201);
    }

    public function update(Request $request, $class)
    {
        $class = ClassModel::findOrFail($class);

        $data = $request->validate([
            'class_name' => ['sometimes','required','string','max:255'],
            'description' => ['sometimes','nullable','string'],
        ]);

        $class->update($data);

        return response()->json($class);
    }

    public function destroy($class)
    {
        $class = ClassModel::findOrFail($class);
        $class->delete();

        return response()->json(['message' => 'deleted']);
    }

    // TAMU: join class -> jadi mahasiswa + init progress
    public function join(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'class_code' => ['required','string'],
        ]);

        $class = ClassModel::where('class_code', $data['class_code'])->first();

        if (!$class) {
            return response()->json(['message' => 'Class code tidak ditemukan'], 404);
        }

        // attach kalau belum join
        $already = $class->users()->where('users.id', $user->id)->exists();
        if (!$already) {
            $class->users()->attach($user->id, ['joined_at' => now()]);
        }

        // role otomatis jadi mahasiswa
        if ($user->role === 'tamu') {
            $user->update(['role' => 'mahasiswa']);
        }

        // init progress berdasarkan material di class (pivot material_class)
        $materials = $class->materials()->orderBy('materials.order_number')->get();

        foreach ($materials as $idx => $mat) {
            UserProgressModel::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'material_id' => $mat->id,
                    'class_id' => $class->id,
                ],
                [
                    'status' => $idx === 0 ? 'unlocked' : 'locked',
                    'completed_at' => null,
                ]
            );
        }

        return response()->json([
            'message' => 'joined',
            'class' => $class,
        ]);
    }
}
