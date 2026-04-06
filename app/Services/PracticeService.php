<?php

namespace App\Services;

use App\Models\PracticeModel;
use App\Models\PracticeAttemptModel;
use App\Models\PracticeQuestionModel;
use App\Models\UserPracticeAnswerModel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

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

        $scores = $this->getLatestScores($userId);

        $anyAttempts = $this->getAnyAttempts($userId);

        $questionCounts = $this->getQuestionCounts();

        return $this->groupPracticesByMaterial($practiceRows, $scores, $questionCounts, $anyAttempts, $readProgress);
    }

    /**
     * Get all practices (per level) for materials created by a specific lecturer (dosen).
     */
    public function getPracticesForLecturer($lecturerId)
    {
        $questionCounts = $this->getQuestionCounts();

        $practiceRows = PracticeModel::query()
            ->join('materials', 'materials.id', '=', 'practices.material_id')
            ->where('materials.created_by', $lecturerId)
            ->select('practices.*', 'materials.material_name')
            ->orderBy('materials.material_name')
            ->orderBy('practices.difficulty_level')
            ->get();

        return $practiceRows->map(function ($row) use ($questionCounts) {
            // $questionCounts berisi Collection: practice_id => Collection(type => total)
            $counts = $questionCounts->get($row->id, collect());
            $totalQuestions = $counts instanceof \Illuminate\Support\Collection
                ? (int) $counts->sum()
                : 0;

            return [
                'id' => $row->id,
                'material_id' => $row->material_id,
                'material_name' => $row->material_name,
                'difficulty_level' => $row->difficulty_level,
                'total_questions' => $totalQuestions,
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
            ->orderBy('practices.difficulty_level')
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
                'difficulty_level' => $row->difficulty_level,
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

    private function groupPracticesByMaterial($practiceRows, $scores, $questionCounts, $activeAttempts, $readProgress)
    {
        $grouped = $practiceRows->groupBy('material_id');

        return $grouped->map(function ($items) use ($scores, $questionCounts, $activeAttempts, $readProgress) {
            $material = $items->first()->material;

            $easy   = $items->firstWhere('difficulty_level', 'easy');
            $normal = $items->firstWhere('difficulty_level', 'normal');
            $hard   = $items->firstWhere('difficulty_level', 'hard');

            $easyId   = $easy?->id;
            $normalId = $normal?->id;
            $hardId   = $hard?->id;

            $activeEasy = $easyId ? $activeAttempts->get($easyId) : null;
            $activeNormal = $normalId ? $activeAttempts->get($normalId) : null;
            $activeHard = $hardId ? $activeAttempts->get($hardId) : null;

            $latestActive = collect([$activeEasy, $activeNormal, $activeHard])
                ->filter()
                ->sortByDesc('created_at')
                ->first();

            $materialId = $material?->id;
            $hasRead = $materialId ? (bool) ($readProgress[$materialId] ?? 0) : false;

            return [
                'material_id'   => $materialId,
                'material_name' => $material?->material_name,
                'levels' => [
                    'easy'   => $easyId,
                    'normal' => $normalId,
                    'hard'   => $hardId,
                ],
                'scores' => [
                    'easy'   => $easyId   ? ($scores[$easyId]   ?? null) : null,
                    'normal' => $normalId ? ($scores[$normalId] ?? null) : null,
                    'hard'   => $hardId   ? ($scores[$hardId]   ?? null) : null,
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
                    'normal' => [
                        'multiple_choice' => $normalId ? ($questionCounts[$normalId]['multiple_choice'] ?? 0) : 0,
                        'drag_drop'       => $normalId ? ($questionCounts[$normalId]['drag_drop'] ?? 0) : 0,
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
        $attempt = PracticeAttemptModel::create([
            'user_id' => $userId,
            'practices_id' => $practiceId,
            'sub_topic_id' => null,
            'attempt_mode' => $data['attempt_mode'] ?? 'regular',
            'attempt_type' => $this->mapAttemptType($data['attempt_mode'] ?? 'regular'),
            'attempt_no' => $this->resolveNextAttemptNo((int) $userId, (int) $practiceId),
            'target_level' => $data['target_level'] ?? ($data['level'] ?? null),
            'placement_level_result' => null,
            'source_from' => $data['level'] ?? null,
            'next_action' => null,
            'total_questions' => (int) ($data['question_count'] ?? 10),
            'correct_answer' => 0,
            'score' => 0,
            'weak_sub_topic' => $data['weak_sub_topic'] ?? null,
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

        
        session([
            "attempt_cfg_{$attempt->id}" => [
                'level' => $data['level'],
                'question_type' => $data['question_type'],
                'question_count' => (int)$data['question_count'],
                'duration_seconds' => 18 * 60,
            ],
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
        $attempt = PracticeAttemptModel::findOrFail($attemptId);
        
        
        if ($attempt->user_id !== Auth::id()) {
            abort(403);
        }

        $cfg = session("attempt_cfg_{$attemptId}", [
            'level' => $attempt->target_level ?: $attempt->practice->difficulty_level,
            'question_type' => 'mixed',
            'question_count' => 10,
            'duration_seconds' => 18 * 60,
            'attempt_mode' => $attempt->attempt_mode ?: 'regular',
            'weak_sub_topic' => $attempt->weak_sub_topic,
            'remediation_round' => (int) ($attempt->remediation_round ?? 0),
        ]);

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

        if (!empty($cfg['weak_sub_topic'])) {
            $query->where('sub_topic', $cfg['weak_sub_topic']);
        }

        if ($cfg['question_type'] !== 'mixed') {
            $query->where('type', $cfg['question_type']);
        }

        $questions = $query->with(['options', 'items'])
            ->inRandomOrder()
            ->limit($cfg['question_count'])
            ->get();

        if ($questions->isEmpty() && !empty($cfg['weak_sub_topic'])) {
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
     * ✅ SUBMIT ANSWERS
     * =================================
     */
    
    public function submitAnswers($attemptId, $answers)
    {
        $attempt = PracticeAttemptModel::findOrFail($attemptId);
        
        
        if ($attempt->user_id !== Auth::id()) {
            abort(403);
        }

        DB::transaction(function () use ($attempt, $answers) {
            $stats = $this->calculateAnswerStats($attempt, $answers);
            
            $attempt->update([
                'finished_at' => now(),
                'mc_correct' => $stats['mcCorrect'],
                'mc_score' => $stats['mcScore'],
                'drag_correct' => $stats['dragCorrect'],
                'drag_score' => $stats['dragScore'],
                'total_earned' => $stats['totalEarned'],
                'final_score' => $stats['totalEarned'],
                'correct_answer' => $stats['mcCorrect'] + $stats['dragCorrect'],
                'score' => $stats['totalEarned'],
                'is_passed' => ($stats['totalEarned'] >= 60) ? 1 : 0,
            ]);
        });

        return $attempt;
    }

    private function calculateAnswerStats($attempt, $answersPayload)
    {
        $questionIds = array_map('intval', array_keys($answersPayload));
        
        $questions = PracticeQuestionModel::query()
            ->whereIn('id', $questionIds)
            ->with(['options', 'items'])
            ->get()
            ->keyBy('id');

        $mcCorrect = 0; $mcScore = 0;
        $dragCorrect = 0; $dragScore = 0;
        $totalEarned = 0;

        foreach ($answersPayload as $qid => $answerData) {
            $qid = (int)$qid;
            $question = $questions->get($qid);
            
            if (!$question) continue;

            $result = $this->evaluateAnswer($question, $answerData);
            
            if ($result['isCorrect']) {
                if ($result['type'] === 'multiple_choice') {
                    $mcCorrect++;
                    $mcScore += $result['score'];
                } else {
                    $dragCorrect++;
                    $dragScore += $result['score'];
                }
            }

            $totalEarned += $result['score'];
            
            
            $this->saveUserAnswer($attempt->id, $qid, $answerData, $result);
        }

        return [
            'mcCorrect' => $mcCorrect,
            'mcScore' => $mcScore,
            'dragCorrect' => $dragCorrect,
            'dragScore' => $dragScore,
            'totalEarned' => $totalEarned,
        ];
    }

    private function evaluateAnswer($question, $answerData)
    {
        $type = $answerData['type'];
        $isCorrect = false;
        $score = 0;
        $questionPoints = (int)($question->points ?? 10);

        if ($type === 'multiple_choice') {
            $optionId = isset($answerData['option_id']) ? (int)$answerData['option_id'] : null;
            $correctOpt = $question->options->firstWhere('is_correct', true);

            $isCorrect = $correctOpt && $optionId && ($correctOpt->id === $optionId);
            $score = $isCorrect ? $questionPoints : 0;
        } else {
            $selectionItems = $answerData['selection_items'] ?? [];
            $correctOrder = $question->items->pluck('item_text')->values()->all();

            $isCorrect = ($selectionItems === $correctOrder);
            $score = $isCorrect ? $questionPoints : 0;
        }

        return [
            'type' => $type,
            'isCorrect' => $isCorrect,
            'score' => $score,
            'optionId' => $answerData['option_id'] ?? null,
            'selectionItems' => $answerData['selection_items'] ?? null,
        ];
    }

    private function saveUserAnswer($attemptId, $questionId, $answerData, $result)
    {
        $prevCount = UserPracticeAnswerModel::query()
            ->where('practice_attempts_id', $attemptId)
            ->where('practice_questions_id', $questionId)
            ->count();

        UserPracticeAnswerModel::create([
            'practice_attempts_id' => $attemptId,
            'practice_attempt_id' => $attemptId,
            'practice_questions_id' => $questionId,
            'practice_options_id' => $result['optionId'],
            'selected_option_id' => $result['optionId'],
            'attempt' => $prevCount + 1,
            'selection_items' => $result['selectionItems'],
            'drag_answer' => $result['selectionItems'],
            'is_correct' => $result['isCorrect'] ? 1 : 0,
            'score' => $result['score'],
            'timespent' => (int)($answerData['timespent'] ?? 0),
        ]);
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
            ->with('question')
            ->get();

        return [
            'practice' => PracticeModel::findOrFail($practiceId),
            'attempt' => $lastAttempt,
            'answers' => $answers,
        ];
    }

    public function determineNextLevel($userId, $materialId, $currentLevel, $currentScore)
    {
        $plan = $this->getAdaptiveStartPlan($userId, $materialId, null);

        return [
            'next_level' => $plan['required_level'] ?? null,
            'message' => $plan['message'],
            'action' => $plan['action'],
            'mode' => $plan['attempt_mode'],
            'weak_sub_topic' => $plan['weak_sub_topic'],
            'remediation_round' => $plan['remediation_round'],
            'recommend_review' => $plan['recommend_review'],
        ];
    }

    public function getAdaptiveStartPlan(int $userId, int $materialId, ?string $requestedLevel = null): array
    {
        $practices = PracticeModel::query()
            ->where('material_id', $materialId)
            ->get()
            ->keyBy('difficulty_level');

        $attempts = PracticeAttemptModel::query()
            ->where('practice_attempts.user_id', $userId)
            ->join('practices', 'practices.id', '=', 'practice_attempts.practices_id')
            ->where('practices.material_id', $materialId)
            ->whereNotNull('practice_attempts.finished_at')
            ->select('practice_attempts.*', 'practices.difficulty_level')
            ->orderByDesc('practice_attempts.finished_at')
            ->get();

        if ($attempts->isEmpty()) {
            return [
                'required_level' => 'normal',
                'attempt_mode' => 'pretest',
                'weak_sub_topic' => null,
                'remediation_round' => 0,
                'action' => 'start_pretest',
                'recommend_review' => false,
                'message' => 'Mulai dari pre-test untuk menentukan level awal kamu.',
                'practice_id' => $practices['normal']->id ?? null,
            ];
        }

        $latest = $attempts->first();
        $latestLevel = $latest->target_level ?: $latest->difficulty_level;
        $latestMode = $latest->attempt_mode ?: 'regular';
        $latestScore = (int) $latest->final_score;

        if ($latestMode === 'pretest') {
            $startLevel = $this->resolveInitialLevelFromPretest($latestScore);

            return [
                'required_level' => $startLevel,
                'attempt_mode' => 'regular',
                'weak_sub_topic' => null,
                'remediation_round' => 0,
                'action' => 'next_level',
                'recommend_review' => false,
                'message' => 'Pre-test selesai. Kamu diarahkan ke level ' . strtoupper($this->toDisplayLevel($startLevel)) . '.',
                'practice_id' => $practices[$startLevel]->id ?? null,
            ];
        }

        if ($latestLevel === 'easy') {
            return $this->resolveEasyPlan($latest, $practices);
        }

        if ($latestLevel === 'normal') {
            return $this->resolveMediumPlan($latest, $practices);
        }

        return $this->resolveHardPlan($latest, $practices);
    }

    private function resolveInitialLevelFromPretest(int $score): string
    {
        if ($score < 60) {
            return 'easy';
        }

        if ($score <= 80) {
            return 'normal';
        }

        return 'hard';
    }

    private function resolveEasyPlan(PracticeAttemptModel $latest, $practices): array
    {
        $score = (int) $latest->final_score;

        if ($score >= 60) {
            return [
                'required_level' => 'normal',
                'attempt_mode' => 'regular',
                'weak_sub_topic' => null,
                'remediation_round' => 0,
                'action' => 'next_level',
                'recommend_review' => false,
                'message' => 'Level Easy tuntas. Lanjut ke level Medium.',
                'practice_id' => $practices['normal']->id ?? null,
            ];
        }

        $nextRound = (int) ($latest->remediation_round ?? 0);
        if (($latest->attempt_mode ?? 'regular') === 'regular') {
            $nextRound = 1;
        } else {
            $nextRound++;
        }

        if ($nextRound > 3) {
            return [
                'required_level' => 'easy',
                'attempt_mode' => 'regular',
                'weak_sub_topic' => $latest->weak_sub_topic,
                'remediation_round' => 3,
                'action' => 'review_material',
                'recommend_review' => true,
                'message' => 'Easy belum mencapai 60 setelah 3 remedial. Baca ulang materi pada sub-topik lemah.',
                'practice_id' => $practices['easy']->id ?? null,
            ];
        }

        $weakSubTopic = $this->resolveWeakSubTopic((int) $latest->id) ?? $latest->weak_sub_topic;

        return [
            'required_level' => 'easy',
            'attempt_mode' => 'remedial',
            'weak_sub_topic' => $weakSubTopic,
            'remediation_round' => $nextRound,
            'action' => 'retry',
            'recommend_review' => false,
            'message' => 'Remedial Easy fokus sub-topik: ' . ($weakSubTopic ?: 'belum terpetakan') . '.',
            'practice_id' => $practices['easy']->id ?? null,
        ];
    }

    private function resolveMediumPlan(PracticeAttemptModel $latest, $practices): array
    {
        $score = (int) $latest->final_score;

        if ($score >= 60) {
            return [
                'required_level' => 'hard',
                'attempt_mode' => 'regular',
                'weak_sub_topic' => null,
                'remediation_round' => 0,
                'action' => 'next_level',
                'recommend_review' => false,
                'message' => 'Level Medium tuntas. Lanjut ke level Hard.',
                'practice_id' => $practices['hard']->id ?? null,
            ];
        }

        if (($latest->attempt_mode ?? 'regular') === 'regular') {
            $weakSubTopic = $this->resolveWeakSubTopic((int) $latest->id);

            return [
                'required_level' => 'normal',
                'attempt_mode' => 'remedial',
                'weak_sub_topic' => $weakSubTopic,
                'remediation_round' => 1,
                'action' => 'retry',
                'recommend_review' => false,
                'message' => 'Remedial Medium 1x pada sub-topik: ' . ($weakSubTopic ?: 'belum terpetakan') . '.',
                'practice_id' => $practices['normal']->id ?? null,
            ];
        }

        $weakSubTopic = $latest->weak_sub_topic ?: $this->resolveWeakSubTopic((int) $latest->id);

        return [
            'required_level' => 'easy',
            'attempt_mode' => 'remedial',
            'weak_sub_topic' => $weakSubTopic,
            'remediation_round' => 1,
            'action' => 'fallback_easy',
            'recommend_review' => false,
            'message' => 'Medium masih < 60 setelah remedial. Turun ke Easy pada sub-topik yang sama.',
            'practice_id' => $practices['easy']->id ?? null,
        ];
    }

    private function resolveHardPlan(PracticeAttemptModel $latest, $practices): array
    {
        $score = (int) $latest->final_score;

        if ($score > 80) {
            return [
                'required_level' => null,
                'attempt_mode' => 'regular',
                'weak_sub_topic' => null,
                'remediation_round' => 0,
                'action' => 'next_material',
                'recommend_review' => false,
                'message' => 'Level Hard > 80. Materi ini selesai.',
                'practice_id' => null,
            ];
        }

        if (($latest->attempt_mode ?? 'regular') === 'regular') {
            $weakSubTopic = $this->resolveWeakSubTopic((int) $latest->id);

            return [
                'required_level' => 'hard',
                'attempt_mode' => 'remedial',
                'weak_sub_topic' => $weakSubTopic,
                'remediation_round' => 1,
                'action' => 'retry',
                'recommend_review' => false,
                'message' => 'Remedial Hard fokus sub-topik: ' . ($weakSubTopic ?: 'belum terpetakan') . '.',
                'practice_id' => $practices['hard']->id ?? null,
            ];
        }

        if ($score < 60) {
            $weakSubTopic = $latest->weak_sub_topic ?: $this->resolveWeakSubTopic((int) $latest->id);

            return [
                'required_level' => 'normal',
                'attempt_mode' => 'remedial',
                'weak_sub_topic' => $weakSubTopic,
                'remediation_round' => 1,
                'action' => 'fallback_medium',
                'recommend_review' => false,
                'message' => 'Hard remedial masih < 60. Turun ke Medium pada sub-topik yang sama.',
                'practice_id' => $practices['normal']->id ?? null,
            ];
        }

        $weakSubTopic = $latest->weak_sub_topic ?: $this->resolveWeakSubTopic((int) $latest->id);

        return [
            'required_level' => 'hard',
            'attempt_mode' => 'remedial',
            'weak_sub_topic' => $weakSubTopic,
            'remediation_round' => 1,
            'action' => 'retry',
            'recommend_review' => false,
            'message' => 'Lanjut remedial Hard sampai skor > 80.',
            'practice_id' => $practices['hard']->id ?? null,
        ];
    }

    private function resolveWeakSubTopic(int $attemptId): ?string
    {
        $rows = UserPracticeAnswerModel::query()
            ->join('practice_questions', 'practice_questions.id', '=', 'user_practice_answers.practice_questions_id')
            ->where('user_practice_answers.practice_attempts_id', $attemptId)
            ->whereNotNull('practice_questions.sub_topic')
            ->where('practice_questions.sub_topic', '!=', '')
            ->select(
                'practice_questions.sub_topic',
                DB::raw('COUNT(*) as total_answered'),
                DB::raw('SUM(CASE WHEN user_practice_answers.is_correct = 1 THEN 1 ELSE 0 END) as total_correct')
            )
            ->groupBy('practice_questions.sub_topic')
            ->get();

        if ($rows->isEmpty()) {
            return null;
        }

        $sorted = $rows
            ->map(function ($row) {
                $total = max((int) $row->total_answered, 1);
                $correct = (int) $row->total_correct;

                return [
                    'sub_topic' => $row->sub_topic,
                    'accuracy' => ($correct / $total) * 100,
                ];
            })
            ->sortBy('accuracy')
            ->values();

        return $sorted->first()['sub_topic'] ?? null;
    }

    private function toDisplayLevel(string $level): string
    {
        return $level === 'normal' ? 'medium' : $level;
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
            ->max('attempt_no') ?? 0);

        return $latestNo + 1;
    }
}