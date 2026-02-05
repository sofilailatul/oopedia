<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\MaterialModel;
use App\Models\UserProgressModel;
use App\Models\MaterialContentModel;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\ProgressService;
use App\Models\QuizMapModel;

class MaterialController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $role = strtolower($user->role ?? 'tamu');
        $userId = $user->id;

        
        $classId = DB::table('class_user')
            ->where('user_id', $userId)
            ->value('class_id');

        $materials = MaterialModel::query()
            ->select('id', 'material_name', 'description', 'order_number', 'created_by')
            ->with(['creator:id,nama'])
            ->orderBy('order_number')
            ->get();

        
        $progressRows = UserProgressModel::query()
            ->where('user_id', $userId)
            ->where('class_id', $classId)
            ->get(['material_id', 'status', 'completed_practice_at', 'completed_quiz_at', 'read_at']);

        
        $progressMap = $progressRows->keyBy('material_id');

        $materials = $materials->values()->map(function ($m, $idx) use ($progressMap, $materials) {
            $row = $progressMap->get($m->id);

            $rawStatus = $row?->status ?? 'locked';

            
            
            
            if ($idx === 0) {
                $effectiveStatus = ($rawStatus === 'locked') ? 'unlocked' : $rawStatus;
            } else {
                $prevMaterialId = $materials[$idx - 1]->id;
                $prevRow = $progressMap->get($prevMaterialId);

                $prevCompleted = ($prevRow?->status === 'completed') || !is_null($prevRow?->completed_practice_at) || !is_null($prevRow?->completed_quiz_at);

                if ($prevCompleted) {
                    
                    $effectiveStatus = ($rawStatus === 'locked') ? 'unlocked' : $rawStatus;
                } else {
                    
                    $effectiveStatus = 'locked';
                }
            }

            return [
                'id' => $m->id,
                'material_name' => $m->material_name,
                'description' => $m->description,
                'order_number' => $m->order_number,
                'author' => $m->creator?->name ?? $m->creator?->nama ?? '—',

                
                'progress' => $effectiveStatus,      
                'raw_progress' => $rawStatus,        
                'read_at' => $row?->read_at,
                'completed_practice_at' => $row?->completed_practice_at,
                'completed_quiz_at' => $row?->completed_quiz_at,
            ];
        });

        return Inertia::render('Materi/Index', [
            'materials' => $materials,
            'role' => $role,
            'permissions' => $this->permissionsByRole($role),
        ]);
    }

    public function show(Request $request, MaterialModel $material)
    {
        $role = strtolower($request->user()->role ?? 'tamu');
        $userId = $request->user()->id;

        $material->load([
            'creator',
            'contents' 
        ]);
        $author = $material->creator?->name
                ?? $material->creator?->nama
                ?? '—';

        
        $classId = DB::table('class_user')
            ->where('user_id', $userId)
            ->value('class_id');

        
        $progress = UserProgressModel::query()
            ->where('user_id', $userId)
            ->where('material_id', $material->id)
            ->where('class_id', $classId)
            ->first();

        return Inertia::render('Materi/Show', [
            'permissions' => $this->permissionsByRole($role),
            'role' => $role,
            'material' => [
                'id' => $material->id,
                'material_name' => $material->material_name,
                'order_number' => $material->order_number,
                'description' => $material->description,
                'author' => $author,
                'contents' => $material->contents,
                'progress' => [
                    'status' => $progress?->status ?? 'unlocked',
                    'read_at' => $progress?->read_at,
                    'completed_practice_at' => $progress?->completed_practice_at,
                    'completed_quiz_at' => $progress?->completed_quiz_at,
                ]
            ],
        ]);
    }

    public function finishRead(Request $request, int $material, ProgressService $progressService) 
    {
        try {
            $user = $request->user();
            $userId = $user->id;

            
            $role = $user->role ?? 'tamu';

            
            $classId = null;

            
            Log::info('FinishRead request received', [
                'user_id' => $userId,
                'material_id' => $material,
                'ip' => $request->ip()
            ]);

            
            $classId = DB::table('class_user')
                ->where('user_id', $userId)
                ->value('class_id');

            
            
            $classId = null;

            
            if ($role === 'mahasiswa') {
                $classId = DB::table('class_user')
                    ->where('user_id', $userId)
                    ->value('class_id');

                if (!$classId) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Anda belum terdaftar di kelas manapun. Silakan bergabung dengan kelas terlebih dahulu.'
                    ], 400);
                }
            }

            
            $materialExists = MaterialModel::where('id', $material)->exists();
            if (!$materialExists) {
                Log::warning('Material not found', [
                    'material_id' => $material
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Materi tidak ditemukan'
                ], 404);
            }

            
            $result = $progressService->markRead($userId, $material, $classId);

            
            Log::info('Material read completed successfully', [
                'user_id' => $userId,
                'material_id' => $material,
                'class_id' => $classId,
                'status' => $result['status'],
                'completed' => $result['completed']
            ]);

            
            return response()->json([
                'success' => true,
                'message' => 'Selamat! Anda telah menyelesaikan membaca materi ini.',
                'data' => [
                    'material_id' => $result['material_id'],
                    'status' => $result['status'],
                    'read_done' => $result['readDone'],
                    'practice_done' => $result['practiceDone'],
                    'completed' => $result['completed'],
                    'quiz_available' => $result['quiz_available'] ?? false, 
                    'next_step' => $this->determineNextStep($result),
                    'next_unlocked_material_id' => $result['next_unlocked_material_id'] ?? null,
                    'message' => $this->getProgressMessage($result),
                ]
            ], 200);


        } catch (\Illuminate\Database\QueryException $e) {
            
            Log::error('Database error in finishRead', [
                'user_id' => $request->user()->id ?? null,
                'material_id' => $material,
                'error' => $e->getMessage(),
                'sql' => $e->getSql() ?? null
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan pada database. Silakan coba lagi.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);

        } catch (\Exception $e) {
            
            Log::error('Error in finishRead', [
                'user_id' => $request->user()->id ?? null,
                'material_id' => $material,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menyimpan progress. Silakan coba lagi.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Helper: Tentukan langkah selanjutnya berdasarkan progress
     */
   private function determineNextStep(array $result): string
   {
       if ($result['completed']) {
           return 'completed';
       }
       if (!$result['readDone']) {
           return 'read';
       }
       if (!$result['practiceDone']) {
           return 'practice';
       }
       return 'completed'; 
   }

    /**
     * Helper: Generate pesan progress yang friendly
     */
    private function getProgressMessage(array $result): string
    {
        if ($result['completed']) {
            return 'Sempurna! Anda telah menyelesaikan semua fase pembelajaran materi ini.';
        }

        if (!$result['practiceDone']) {
            return 'Langkah selanjutnya Kerjakan latihan soal untuk menguji pemahaman Anda.';
        }

        return 'Lanjutkan pembelajaran Anda!';
    }

    private function permissionsByRole(string $role): array
    {
        $role = strtolower($role);

        return match ($role) {
            'admin', 'superadmin', 'dosen' => [
                'can_manage' => true,
                'can_read_material' => true,
                'can_practice' => true,
            ],
            'mahasiswa' => [
                'can_manage' => false,
                'can_read_material' => true,
                'can_practice' => true,
            ],
            default => [ 
                'can_manage' => false,
                'can_read_material' => true,
                'can_practice' => true,
            ],
        };
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'material_name' => ['required','string','max:255'],
            'order_number' => ['required','integer','min:1'],
            'description' => ['nullable','string'],
            'content' => ['nullable','string'],
        ]);

        $material = MaterialModel::create([
            ...$data,
            'created_by' => $request->user()->id,
        ]);

        return response()->json($material, 201);
    }

    public function update(Request $request, $material)
    {
        $material = MaterialModel::findOrFail($material);

        $data = $request->validate([
            'material_name' => ['sometimes','required','string','max:255'],
            'order_number' => ['sometimes','required','integer','min:1'],
            'description' => ['sometimes','nullable','string'],
            'content' => ['sometimes','nullable','string'],
        ]);

        $material->update($data);

        return response()->json($material);
    }

    public function destroy($material)
    {
        $material = MaterialModel::findOrFail($material);
        $material->delete();

        return response()->json(['message' => 'deleted']);
    }

    
    public function storeSection(Request $request, $material)
    {
        $material = MaterialModel::findOrFail($material);

        $data = $request->validate([
            'title' => ['nullable','string','max:255'],
            'content_text' => ['required','string'],
            'image' => ['nullable','image','mimes:png,jpg,jpeg,webp','max:2048'],
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')
                ->store("materials/{$material->id}/sections", "public");
        }

        $maxSort = MaterialContentModel::where('material_id', $material->id)->max('sort_order') ?? 0;

        $section = MaterialContentModel::create([
            'material_id' => $material->id,
            'title' => $data['title'] ?? null,
            'content_text' => $data['content_text'],
            'image_path' => $imagePath,
            'sort_order' => $maxSort + 1,
        ]);

        return response()->json($section, 201);
    }

    public function updateSection(Request $request, $material, $section)
    {
        $material = MaterialModel::findOrFail($material);

        $section = MaterialContentModel::where('material_id', $material->id)
            ->findOrFail($section);

        $data = $request->validate([
            'title' => ['sometimes','nullable','string','max:255'],
            'content_text' => ['sometimes','required','string'],
            'image_path' => ['sometimes','nullable','string','max:255'],
        ]);

        $section->update($data);

        return response()->json($section);
    }

    public function deleteSection($material, $section)
    {
        $material = MaterialModel::findOrFail($material);

        $section = MaterialContentModel::where('material_id', $material->id)
            ->findOrFail($section);

        $section->delete();

        return response()->json(['message' => 'deleted']);
    }

    public function reorderSections(Request $request, $material)
    {
        $material = MaterialModel::findOrFail($material);

        $data = $request->validate([
            'section_ids' => ['required','array','min:1'],
            'section_ids.*' => ['integer'],
        ]);

        DB::transaction(function () use ($material, $data) {
            foreach ($data['section_ids'] as $i => $id) {
                MaterialContentModel::where('material_id', $material->id)
                    ->where('id', $id)
                    ->update(['sort_order' => $i + 1]);
            }
        });

        return response()->json(['message' => 'reordered']);
    }
}