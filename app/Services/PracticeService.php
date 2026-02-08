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
        // Ambil semua practice dengan material
        $practiceRows = PracticeModel::query()
            ->with('material:id,material_name')
            ->orderBy('material_id')
            ->get();

        // Ambil scores terbaru per practice
        $scores = $this->getLatestScores($userId);
        
        // Hitung jumlah soal per practice
        $questionCounts = $this->getQuestionCounts();
        
        // Group per material
        return $this->groupPracticesByMaterial($practiceRows, $scores, $questionCounts);
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

    private function groupPracticesByMaterial($practiceRows, $scores, $questionCounts)
    {
        $grouped = $practiceRows->groupBy('material_id');

        return $grouped->map(function ($items) use ($scores, $questionCounts) {
            $material = $items->first()->material;

            $easy   = $items->firstWhere('difficulty_level', 'easy');
            $normal = $items->firstWhere('difficulty_level', 'normal');
            $hard   = $items->firstWhere('difficulty_level', 'hard');

            $easyId   = $easy?->id;
            $normalId = $normal?->id;
            $hardId   = $hard?->id;

            return [
                'material_id'   => $material?->id,
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
        // Validasi level
        $this->validateLevel($userId, $practiceId, $data['level']);
        
        // Buat attempt
        return $this->createAttempt($userId, $practiceId, $data);
    }

    private function validateLevel($userId, $practiceId, $selectedLevel)
    {
        // Cek apakah practice ada
        $practice = PracticeModel::findOrFail($practiceId);
        
        // Jika bukan normal, pastikan normal sudah selesai
        if ($selectedLevel !== 'normal') {
            $this->validateNormalCompleted($userId, $practice->material_id);
        }
    }

    private function validateNormalCompleted($userId, $materialId)
    {
        $normalPractice = PracticeModel::query()
            ->where('material_id', $materialId)
            ->where('difficulty_level', 'normal')
            ->first();

        if (!$normalPractice) {
            return; // Tidak ada normal practice
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

        // Simpan config di session
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
        
        // Pastikan user punya akses
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
        
        // Pastikan user punya akses
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
            
            // Simpan jawaban
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