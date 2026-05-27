<?php

namespace App\Http\Controllers\Mahasiswa;

use App\Http\Controllers\Controller;
use App\Models\MaterialModel;
use App\Models\PracticeAttemptModel;
use App\Models\PracticeModel;
use App\Models\UserProgressModel;
use App\Services\ProgressService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class MaterialController extends Controller
{
	public function IndexMahasiswa(Request $request)
	{
		$user = $request->user();
		$role = strtolower($user->role ?? 'tamu');
		$userId = $user->id;
		$passingScore = 60;

		$classId = DB::table('class_user')
			->where('user_id', $userId)
			->value('class_id');

		$query = MaterialModel::query()
			->select('id', 'material_name', 'description', 'order_number', 'created_by')
			->with(['creator:id,nama']);

		if ($classId) {
			$dosenId = DB::table('classes')
				->where('id', $classId)
				->value('created_by');
			if ($dosenId) {
				$query->where('created_by', $dosenId);
			}
		} elseif ($role === 'mahasiswa') {
			$query->where('id', 0);
		}

		$materials = $query->orderBy('order_number')->get();

		$progressRowsQuery = UserProgressModel::query()
			->where('user_id', $userId);

		if (is_null($classId)) {
			$progressRowsQuery->whereNull('class_id');
		} else {
			$progressRowsQuery->where('class_id', $classId);
		}

		$progressRows = $progressRowsQuery
			->get(['material_id', 'status', 'completed_practice_at', 'completed_quiz_at', 'read_at']);

		$progressMap = $progressRows->keyBy('material_id');
		$materialIds = $materials->pluck('id')->filter()->values();

		$practiceRows = PracticeModel::query()
			->whereIn('material_id', $materialIds)
			->get(['id', 'material_id', 'level']);

		$practiceByMaterial = $practiceRows->groupBy('material_id');

		$latestAttemptSub = PracticeAttemptModel::query()
			->where('user_id', $userId)
			->whereNotNull('finished_at')
			->select('practices_id', DB::raw('MAX(created_at) as max_created_at'))
			->groupBy('practices_id');

		$latestScoreMap = PracticeAttemptModel::query()
			->joinSub($latestAttemptSub, 'latest_attempt', function ($join) {
				$join->on('practice_attempts.practices_id', '=', 'latest_attempt.practices_id')
					->on('practice_attempts.created_at', '=', 'latest_attempt.max_created_at');
			})
			->pluck('practice_attempts.final_score', 'practice_attempts.practices_id');

		$computeMaterialStatus = function (int $materialId) use ($progressMap, $practiceByMaterial, $latestScoreMap, $passingScore) {
			$row = $progressMap->get($materialId);
			$hasRead = !is_null($row?->read_at);

			// Jika backend sudah menandai progress sebagai completed (lulus hard level),
			// langsung return 'completed' tanpa perlu menghitung ulang skor latihan.
			if ($row?->status === 'completed') {
				return 'completed';
			}

			$levels = collect($practiceByMaterial->get($materialId, collect()))->keyBy('level');

			$easyId = $levels->get('easy')?->id;
			$mediumId = $levels->get('medium')?->id;
			$hardId = $levels->get('hard')?->id;

			$easyScore = $easyId ? (int) ($latestScoreMap[$easyId] ?? -1) : -1;
			$mediumScore = $mediumId ? (int) ($latestScoreMap[$mediumId] ?? -1) : -1;
			$hardScore = $hardId ? (int) ($latestScoreMap[$hardId] ?? -1) : -1;

			$allLevelsPassed = ($easyScore >= $passingScore)
				&& ($mediumScore >= $passingScore)
				&& ($hardScore >= 80);

			$hasAnyPracticeAttempt = $easyScore >= 0 || $mediumScore >= 0 || $hardScore >= 0;

			if ($hasRead && $allLevelsPassed) {
				return 'completed';
			}

			if ($hasRead || $hasAnyPracticeAttempt) {
				return 'in_progress';
			}

			return $row?->status ?? 'locked';
		};

		$materials = $materials->values()->map(function ($m, $idx) use ($progressMap, $materials, $computeMaterialStatus) {
			$row = $progressMap->get($m->id);
			$rawStatus = $computeMaterialStatus($m->id);

			if ($idx === 0) {
				$effectiveStatus = ($rawStatus === 'locked') ? 'unlocked' : $rawStatus;
			} else {
				$prevMaterialId = $materials[$idx - 1]->id;
				$prevCompleted = $computeMaterialStatus($prevMaterialId) === 'completed';

				$effectiveStatus = $prevCompleted
					? (($rawStatus === 'locked') ? 'unlocked' : $rawStatus)
					: 'locked';
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

		$material->load(['creator', 'contents']);
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
				],
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
				'ip' => $request->ip(),
			]);

			if ($role === 'mahasiswa') {
				$classId = DB::table('class_user')
					->where('user_id', $userId)
					->value('class_id');

				if (!$classId) {
					return response()->json([
						'success' => false,
						'message' => 'Anda belum terdaftar di kelas manapun. Silakan bergabung dengan kelas terlebih dahulu.',
					], 400);
				}
			}

			$materialExists = MaterialModel::where('id', $material)->exists();
			if (!$materialExists) {
				Log::warning('Material not found', [
					'material_id' => $material,
				]);

				return response()->json([
					'success' => false,
					'message' => 'Materi tidak ditemukan',
				], 404);
			}

			$result = $progressService->markRead($userId, $material, $classId);

			Log::info('Material read completed successfully', [
				'user_id' => $userId,
				'material_id' => $material,
				'class_id' => $classId,
				'status' => $result['status'],
				'completed' => $result['completed'],
			]);

			return response()->json([
				'success' => true,
				'message' => 'Selamat! Anda telah menyelesaikan membaca materi ini.',
				'data' => [
					'material_id' => $result['material_id'],
					'status' => $result['status'],
					'read_done' => $result['readDone'],
					'practice_done' => $result['practiceDone'],
					'has_practice' => $result['has_practice'] ?? false,
					'completed' => $result['completed'],
					'quiz_available' => $result['quiz_available'] ?? false,
					'next_step' => $this->determineNextStep($result),
					'next_unlocked_material_id' => $result['next_unlocked_material_id'] ?? null,
					'message' => $this->getProgressMessage($result),
				],
			], 200);
		} catch (\Illuminate\Database\QueryException $e) {
			Log::error('Database error in finishRead', [
				'user_id' => $request->user()->id ?? null,
				'material_id' => $material,
				'error' => $e->getMessage(),
				'sql' => $e->getSql() ?? null,
			]);

			return response()->json([
				'success' => false,
				'message' => 'Terjadi kesalahan pada database. Silakan coba lagi.',
				'error' => config('app.debug') ? $e->getMessage() : null,
			], 500);
		} catch (\Exception $e) {
			Log::error('Error in finishRead', [
				'user_id' => $request->user()->id ?? null,
				'material_id' => $material,
				'error' => $e->getMessage(),
				'trace' => $e->getTraceAsString(),
			]);

			return response()->json([
				'success' => false,
				'message' => 'Terjadi kesalahan saat menyimpan progress. Silakan coba lagi.',
				'error' => config('app.debug') ? $e->getMessage() : null,
			], 500);
		}
	}

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
}
