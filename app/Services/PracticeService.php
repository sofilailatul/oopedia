<?php

namespace App\Services;

use App\Models\PracticeModel;
use App\Models\PracticeAttemptModel;
use App\Models\PracticeQuestionModel;
use App\Models\UserPracticeAnswerModel;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PracticeService
{
    /**
     * =================================
     * 📊 GET PRACTICES DATA
     * =================================
     */
    
    public function getPracticesForUser($userId)
    {
        // Semua latihan soal yang tersedia
        $practiceRows = PracticeModel::query()
            ->with('material:id,material_name')
            ->orderBy('material_id')
            ->get();

        // Progress membaca materi per user (apakah sudah pernah selesai membaca)
        $readProgress = DB::table('user_progress')
            ->where('user_id', $userId)
            ->select('material_id', DB::raw('MAX(CASE WHEN read_at IS NULL THEN 0 ELSE 1 END) as read_done'))
            ->groupBy('material_id')
            ->pluck('read_done', 'material_id');

        $progressRows = DB::table('user_progress as up')
            ->leftJoin('subtopics as st', 'st.id', '=', 'up.focused_subtopic_id')
            ->where('up.user_id', $userId)
            ->select(
                'up.material_id',
                'up.status',
                'up.current_mode',
                'up.current_level',
                'up.pretest_score',
                'up.last_score',
                'up.next_action',
                'up.focused_subtopic_id',
                'st.name as focused_subtopic_name',
                'up.completed_pretest_at'
            )
            ->get()
            ->keyBy('material_id');

        $scores = $this->getLatestScores($userId);
        $scoresByMode = $this->getLatestScoresByMode($userId);

        $anyAttempts = $this->getAnyAttempts($userId);

        $questionCounts = $this->getQuestionCounts();

        return $this->groupPracticesByMaterial($practiceRows, $scores, $scoresByMode, $questionCounts, $anyAttempts, $readProgress, $progressRows);
    }

    /**
     * Get all practices (per level) for materials created by a specific lecturer (dosen).
     */
    public function getPracticesForLecturer($lecturerId)
    {
        return PracticeModel::query()
            ->withCount('questions') // otomatis hitung soal
            ->with('material:id,material_name')
            ->whereHas('material', function ($q) use ($lecturerId) {
                $q->where('created_by', $lecturerId);
            })
            ->orderBy('material_id')
            ->orderBy('level') 
            ->get()
            ->map(function ($practice) {
                return [
                    'id' => $practice->id,
                    'material_id' => $practice->material_id,
                    'material_name' => $practice->material->material_name ?? '-',
                    'type' => $practice->type ?? 'practice',
                    'level' => $practice->level, 
                    'total_questions' => $practice->questions_count, 
                ];
            });
    }

    /**
     * Get all practices (per level) for admin/superadmin (tanpa filter created_by).
     */
    public function getPracticesForAdmin()
    {
        $questionCounts = $this->getQuestionCounts();

        $practiceRows = PracticeModel::query()
            ->join('materials', 'materials.id', '=', 'practices.material_id')
            ->select('practices.*', 'materials.material_name')
            ->orderBy('materials.material_name')
            ->orderBy('practices.level')
            ->get();

        return $practiceRows->map(function ($row) use ($questionCounts) {
            $counts = $questionCounts->get($row->id, collect());
            $totalQuestions = $counts instanceof \Illuminate\Support\Collection
                ? (int) $counts->sum()
                : 0;

            return [
                'id' => $row->id,
                'material_id' => $row->material_id,
                'material_name' => $row->material_name,
                'type' => $row->type ?? 'practice',
                'level' => $row->level,
                'total_questions' => $totalQuestions,
            ];
        });
    }

    private function getLatestScores($userId)
    {
        $attemptTable = (new PracticeAttemptModel())->getTable();
        
        $latestAttemptSub = PracticeAttemptModel::query()
            ->where('user_id', $userId)
            ->select('practices_id', DB::raw('MAX(created_at) as max_created_at'))
            ->groupBy('practices_id');

        return PracticeAttemptModel::query()
            ->joinSub($latestAttemptSub, 'latest', function ($join) use ($attemptTable) {
                $join->on("$attemptTable.practices_id", '=', 'latest.practices_id')
                     ->on("$attemptTable.created_at", '=', 'latest.max_created_at');
            })
            ->where("$attemptTable.user_id", $userId)
            ->pluck("$attemptTable.final_score", "$attemptTable.practices_id");
    }

    private function getLatestScoresByMode($userId)
    {
        $rows = PracticeAttemptModel::query()
            ->where('user_id', $userId)
            ->where('attempt_type', 'practice')
            ->whereNotNull('finished_at')
            ->select('practices_id', 'mode', 'final_score', 'created_at')
            ->orderByDesc('created_at')
            ->get();

        return $rows
            ->groupBy('practices_id')
            ->map(function ($attempts) {
                $out = [
                    'normal' => null,
                    'focused_remedial' => null,
                ];

                foreach ($attempts as $attempt) {
                    $mode = $attempt->mode ?: 'normal';
                    if (!array_key_exists($mode, $out)) {
                        continue;
                    }

                    if ($out[$mode] === null) {
                        $out[$mode] = $attempt->final_score !== null ? (int) $attempt->final_score : null;
                    }
                }

                return $out;
            });
    }

    private function getQuestionCounts()
    {
        return PracticeQuestionModel::query()
            ->select('practices_id', 'type', DB::raw('COUNT(*) as total'))
            ->groupBy('practices_id', 'type')
            ->get()
            ->groupBy('practices_id')
            ->map(function ($rows) {
                return $rows->pluck('total', 'type');
            });
    }

    private function getAnyAttempts($userId)
    {
        $attemptTable = (new PracticeAttemptModel())->getTable();

        $latestSub = PracticeAttemptModel::query()
            ->where('user_id', $userId)
            ->select('practices_id', DB::raw('MAX(created_at) as max_created_at'))
            ->groupBy('practices_id');

        return PracticeAttemptModel::query()
            ->joinSub($latestSub, 'latest', function ($join) use ($attemptTable) {
                $join->on("$attemptTable.practices_id", '=', 'latest.practices_id')
                    ->on("$attemptTable.created_at", '=', 'latest.max_created_at');
            })
            ->where("$attemptTable.user_id", $userId)
            ->get()
            ->keyBy('practices_id');
    }

    private function groupPracticesByMaterial($practiceRows, $scores, $scoresByMode, $questionCounts, $activeAttempts, $readProgress, $progressRows)
    {
        $grouped = $practiceRows->groupBy('material_id');

        return $grouped->map(function ($items) use ($scores, $scoresByMode, $questionCounts, $activeAttempts, $readProgress, $progressRows) {
            $material = $items->first()->material;

            $easy = $items->firstWhere('level', 'easy');
            $medium = $items->firstWhere('level', 'medium');
            $hard = $items->firstWhere('level', 'hard');

            $easyId = $easy?->id;
            $mediumId = $medium?->id;
            $hardId = $hard?->id;

            $easyScoresByMode = $easyId ? ($scoresByMode->get($easyId) ?? ['normal' => null, 'focused_remedial' => null]) : ['normal' => null, 'focused_remedial' => null];
            $mediumScoresByMode = $mediumId ? ($scoresByMode->get($mediumId) ?? ['normal' => null, 'focused_remedial' => null]) : ['normal' => null, 'focused_remedial' => null];
            $hardScoresByMode = $hardId ? ($scoresByMode->get($hardId) ?? ['normal' => null, 'focused_remedial' => null]) : ['normal' => null, 'focused_remedial' => null];

            $activeEasy = $easyId ? $activeAttempts->get($easyId) : null;
            $activeMedium = $mediumId ? $activeAttempts->get($mediumId) : null;
            $activeHard = $hardId ? $activeAttempts->get($hardId) : null;

            $latestActive = collect([$activeEasy, $activeMedium, $activeHard])
                ->filter()
                ->sortByDesc('created_at')
                ->first();

            $materialId = $material?->id;
            $hasRead = $materialId ? (bool) ($readProgress[$materialId] ?? 0) : false;
            $progress = $materialId ? $progressRows->get($materialId) : null;

            return [
                'material_id'   => $materialId,
                'material_name' => $material?->material_name,
                'progress' => $progress ? [
                    'status' => $progress->status,
                    'current_mode' => $progress->current_mode,
                    'current_level' => $progress->current_level,
                    'pretest_score' => $progress->pretest_score,
                    'last_score' => $progress->last_score,
                    'next_action' => $progress->next_action,
                    'focused_subtopic_id' => $progress->focused_subtopic_id,
                    'focused_subtopic_name' => $progress->focused_subtopic_name,
                    'completed_pretest_at' => $progress->completed_pretest_at,
                ] : null,
                'levels' => [
                    'easy' => $easyId,
                    'medium' => $mediumId,
                    'hard' => $hardId,
                ],
                'scores' => [
                    'easy' => $easyId ? ($scores[$easyId] ?? null) : null,
                    'medium' => $mediumId ? ($scores[$mediumId] ?? null) : null,
                    'hard' => $hardId ? ($scores[$hardId] ?? null) : null,
                ],
                'scores_by_mode' => [
                    'easy' => $easyScoresByMode,
                    'medium' => $mediumScoresByMode,
                    'hard' => $hardScoresByMode,
                ],
                'has_active_attempt' => (bool) $latestActive,
                'active_attempt' => $latestActive ? [
                    'id' => $latestActive->id,
                    'practices_id' => $latestActive->practices_id,
                ] : null,
                // Bisa mulai latihan hanya jika materi sudah dibaca (read_at tidak null)
                'material_read' => $hasRead,
                'is_locked' => !$hasRead,
                'question_counts' => [
                    'easy' => [
                        'multiple_choice' => $easyId ? ($questionCounts[$easyId]['multiple_choice'] ?? 0) : 0,
                        'drag_drop'       => $easyId ? ($questionCounts[$easyId]['drag_drop'] ?? 0) : 0,
                    ],
                    'medium' => [
                        'multiple_choice' => $mediumId ? ($questionCounts[$mediumId]['multiple_choice'] ?? 0) : 0,
                        'drag_drop'       => $mediumId ? ($questionCounts[$mediumId]['drag_drop'] ?? 0) : 0,
                    ],
                    'hard' => [
                        'multiple_choice' => $hardId ? ($questionCounts[$hardId]['multiple_choice'] ?? 0) : 0,
                        'drag_drop'       => $hardId ? ($questionCounts[$hardId]['drag_drop'] ?? 0) : 0,
                    ],
                ],
            ];
        })->values();
    }

    /**
     * =================================
     * 🎯 VALIDATE & CREATE ATTEMPT
     * =================================
     */
    
    public function validateAndCreateAttempt($userId, $practiceId, $data)
    {
        
        $this->validateLevel($userId, $practiceId, $data['level']);
        
        
        return $this->createAttempt($userId, $practiceId, $data);
    }

    private function validateLevel($userId, $practiceId, $selectedLevel)
    {
        $practice = PracticeModel::findOrFail($practiceId);

        // Pastikan user sudah menyelesaikan membaca materi sebelum bisa mengerjakan latihan
        $this->ensureMaterialRead($userId, $practice->material_id);
    }

    private function ensureMaterialRead($userId, $materialId)
    {
        $hasRead = DB::table('user_progress')
            ->where('user_id', $userId)
            ->where('material_id', $materialId)
            ->whereNotNull('read_at')
            ->exists();

        if (!$hasRead) {
            throw new \Exception('Kamu perlu menyelesaikan membaca materi ini terlebih dahulu.');
        }
    }

    private function createAttempt($userId, $practiceId, $data)
    {
        $mode = $data['mode'] ?? 'normal';
        $level = $data['level'] ?? null;

        $attempt = PracticeAttemptModel::create([
            'user_id' => $userId,
            'practices_id' => $practiceId,
            'subtopic_id' => null,
            'mode' => $mode,
            'attempt_type' => $this->mapAttemptType($mode),
            'attempt_number' => $this->resolveNextAttemptNo((int) $userId, (int) $practiceId),
            'level' => $level,
            'source_from' => $level,
            'next_action' => null,
            'total_questions' => (int) ($data['question_count'] ?? 10),
            'correct_answer' => 0,
            'score' => 0,
            'focused_subtopic_id' => $data['focused_subtopic_id'] ?? null,
            'remediation_round' => (int) ($data['remediation_round'] ?? 0),
            'started_at' => now(),
            'finished_at' => null,
            'mc_correct' => 0,
            'mc_score' => 0,
            'drag_correct' => 0,
            'drag_score' => 0,
            'total_earned' => 0,
            'final_score' => 0,
            'is_passed' => 0,
        ]);

        return $attempt;
    }

    /**
     * =================================
     * 📝 GET ATTEMPT DETAIL
     * =================================
     */
    
    public function getAttemptDetail($attemptId)
    {
        $attempt = PracticeAttemptModel::with('practice')->findOrFail($attemptId);
        
        
        if ($attempt->user_id !== Auth::id()) {
            abort(403);
        }

        $practiceLevel = $attempt->practice?->level;

        $cfg = [
            'level' => $attempt->level ?? $practiceLevel,
            'question_type' => 'mixed',
            'question_count' => (int) ($attempt->total_questions ?? 10),
            'duration_seconds' => (int) ($attempt->duration_seconds ?? 18 * 60),
            'mode' => $attempt->mode ?? 'normal',
            'focused_subtopic_id' => $attempt->focused_subtopic_id ?? null,
            'remediation_round' => (int) ($attempt->remediation_round ?? 0),
        ];

        $questions = $this->getQuestionsForAttempt($attempt->practices_id, $cfg);
        $savedAnswers = $this->getSavedAnswers($attemptId);

        return [
            'attempt' => $attempt,
            'cfg' => $cfg,
            'questions' => $questions,
            'savedAnswers' => $savedAnswers,
        ];
    }

    private function getQuestionsForAttempt($practiceId, $cfg)
    {
        $query = PracticeQuestionModel::query()
            ->where('practices_id', $practiceId);

        if (!empty($cfg['focused_subtopic_id'])) {
            $query->where('subtopic_id', $cfg['focused_subtopic_id']);
        }

        if ($cfg['question_type'] !== 'mixed') {
            $query->where('type', $cfg['question_type']);
        }

        $questions = $query->with(['options', 'items'])
            ->inRandomOrder()
            ->limit($cfg['question_count'])
            ->get();

        if ($questions->isEmpty() && !empty($cfg['focused_subtopic_id'])) {
            $fallback = PracticeQuestionModel::query()->where('practices_id', $practiceId);

            if ($cfg['question_type'] !== 'mixed') {
                $fallback->where('type', $cfg['question_type']);
            }

            return $fallback->with(['options', 'items'])
                ->inRandomOrder()
                ->limit($cfg['question_count'])
                ->get();
        }

        return $questions;
    }

    private function getSavedAnswers($attemptId)
    {
        return UserPracticeAnswerModel::query()
            ->where('practice_attempts_id', $attemptId)
            ->get()
            ->keyBy('practice_questions_id');
    }

    /**
     * =================================
     * 📊 GET SUMMARY
     * =================================
     */
    
    public function getSummary($userId, $practiceId)
    {
        $lastAttempt = PracticeAttemptModel::query()
            ->where('user_id', $userId)
            ->where('practices_id', $practiceId)
            ->whereNotNull('finished_at')
            ->latest('finished_at')
            ->first();

        if (!$lastAttempt) {
            return null;
        }

        $answers = UserPracticeAnswerModel::query()
            ->where('practice_attempts_id', $lastAttempt->id)
            ->with([
                'question.options',
                'question.items',
                'option',
            ])
            ->get();

        return [
            'practice' => PracticeModel::findOrFail($practiceId),
            'attempt' => $lastAttempt,
            'answers' => $answers,
        ];
    }

    private function mapAttemptType(string $attemptMode): string
    {
        if ($attemptMode === 'pretest') {
            return 'pretest';
        }

        if ($attemptMode === 'remedial') {
            return 'remedial';
        }

        return 'practice';
    }

    private function resolveNextAttemptNo(int $userId, int $practiceId): int
    {
        $latestNo = (int) (PracticeAttemptModel::query()
            ->where('user_id', $userId)
            ->where('practices_id', $practiceId)
            ->max('attempt_number') ?? 0);

        return $latestNo + 1;
    }

    //new service
    public function getPretestPracticeByMaterial(int $materialId): ?PracticeModel
    {
        return PracticeModel::query()
            ->where('material_id', $materialId)
            ->where('type', 'pretest')
            ->first();
    }
}