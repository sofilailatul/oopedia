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

        if ($selectedLevel !== 'normal') {
            $this->validateNormalCompleted($userId, $practice->material_id);
        }
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

    private function validateNormalCompleted($userId, $materialId)
    {
        $normalPractice = PracticeModel::query()
            ->where('material_id', $materialId)
            ->where('difficulty_level', 'normal')
            ->first();

        if (!$normalPractice) {
            return; 
        }

        $hasFinishedNormal = PracticeAttemptModel::query()
            ->where('user_id', $userId)
            ->where('practices_id', $normalPractice->id)
            ->whereNotNull('finished_at')
            ->exists();

        if (!$hasFinishedNormal) {
            throw new \Exception('Kamu wajib menyelesaikan level NORMAL terlebih dahulu.');
        }
    }

    private function createAttempt($userId, $practiceId, $data)
    {
        $attempt = PracticeAttemptModel::create([
            'user_id' => $userId,
            'practices_id' => $practiceId,
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
            'level' => $attempt->practice->difficulty_level,
            'question_type' => 'mixed',
            'question_count' => 10,
            'duration_seconds' => 18 * 60,
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

        if ($cfg['question_type'] !== 'mixed') {
            $query->where('type', $cfg['question_type']);
        }

        return $query->with(['options', 'items'])
            ->inRandomOrder()
            ->limit($cfg['question_count'])
            ->get();
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
                    $mcScore += 50;
                } else {
                    $dragCorrect++;
                    $dragScore += 50;
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

        if ($type === 'multiple_choice') {
            $optionId = isset($answerData['option_id']) ? (int)$answerData['option_id'] : null;
            $correctOpt = $question->options->firstWhere('is_correct', true);

            $isCorrect = $correctOpt && $optionId && ($correctOpt->id === $optionId);
            $score = $isCorrect ? 50 : 0;
        } else {
            $selectionItems = $answerData['selection_items'] ?? [];
            $correctOrder = $question->items->pluck('item_text')->values()->all();

            $isCorrect = ($selectionItems === $correctOrder);
            $score = $isCorrect ? 50 : 0;
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
            'practice_questions_id' => $questionId,
            'practice_options_id' => $result['optionId'],
            'attempt' => $prevCount + 1,
            'selection_items' => $result['selectionItems'],
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
}