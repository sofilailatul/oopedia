<?php

namespace App\Services;

use App\Models\UserProgressModel;
use App\Models\PracticeAttemptModel;
use Illuminate\Support\Facades\DB;

class LearningPathService
{
    public function handlePretest(UserProgressModel $progress, int $score, ?array $weakSubtopicIds): UserProgressModel
    {
        $progress->pretest_score = $score;
        $progress->last_score    = $score;
        $progress->focused_subtopic_id = $weakSubtopicIds[0] ?? null;
        $progress->focused_subtopic_ids = !empty($weakSubtopicIds) ? json_encode($weakSubtopicIds) : null;

        if ($score < 60) {
            $progress->current_level = 'easy';
            $progress->next_action   = 'start_easy';
        } elseif ($score <= 80) {
            $progress->current_level = 'medium';
            $progress->next_action   = 'start_medium';
        } else {
            $progress->current_level = 'hard';
            $progress->next_action   = 'start_hard';
        }

        $progress->current_mode        = 'normal';
        $progress->easy_remedial_count   = 0;
        $progress->medium_remedial_count = 0;
        $progress->hard_remedial_count   = 0;
        $progress->completed_pretest_at  = now();
        $progress->save();

        return $progress;
    }

    public function handlePractice(UserProgressModel $progress, PracticeAttemptModel $attempt): UserProgressModel
    {
        $score          = (int) $attempt->final_score;
        $level          = $attempt->level;
        $score          = (int) $attempt->final_score;
        $level          = $attempt->level;
        
        $weakSubtopicIds = $this->calculateUpdatedWeakSubtopics($progress, $attempt->id);
        $primaryWeakId   = $weakSubtopicIds[0] ?? null;
        $jsonWeakIds     = count($weakSubtopicIds) > 0 ? json_encode($weakSubtopicIds) : null;

        $progress->last_score = $score;

        if ($level === 'easy') {
            return $this->handleEasy($progress, $score, $primaryWeakId, $jsonWeakIds);
        }

        if ($level === 'medium' || $level === 'normal') {
            return $this->handleMedium($progress, $score, $primaryWeakId, $jsonWeakIds);
        }

        if ($level === 'hard') {
            return $this->handleHard($progress, $score, $primaryWeakId, $jsonWeakIds);
        }

        return $progress;
    }

    // ---------------------------------------------------------------
    // EASY
    // Flowchart:
    //   normal easy >= 60         → naik medium
    //   normal easy < 60          → focused_remedial easy (attempt ke-1)
    //   focused_remedial easy >= 60 → naik medium
    //   focused_remedial easy < 60  → ulangi lagi (max 3x total)
    //   sudah 3x dan tetap < 60   → repeat_material
    // ---------------------------------------------------------------
    private function handleEasy(UserProgressModel $progress, int $score, ?int $weakSubtopicId, ?string $jsonWeakIds): UserProgressModel
    {
        if ($score >= 60) {
            // Lulus easy → naik medium
            $progress->current_level         = 'medium';
            $progress->current_mode          = 'normal';
            $progress->focused_subtopic_id   = null;
            $progress->focused_subtopic_ids  = null;
            $progress->easy_remedial_count   = 0;
            $progress->next_action           = 'start_medium';

            $progress->save();
            return $progress;
        }

        // Gagal — naikkan counter remedial
        $progress->focused_subtopic_id = $weakSubtopicId;
        $progress->focused_subtopic_ids = $jsonWeakIds;
        $progress->easy_remedial_count = ($progress->easy_remedial_count ?? 0) + 1;

        if ($progress->easy_remedial_count >= 3) {
            // Sudah 3x remedial, tetap gagal → baca materi
            $progress->current_mode = 'repeat_material';
            $progress->next_action  = 'read_material_again';
        } else {
            // Masih bisa remedial lagi
            $progress->current_mode = 'focused_remedial';
            $progress->next_action  = 'repeat_easy_subtopic';
        }

        $progress->save();
        return $progress;
    }

    // ---------------------------------------------------------------
    // MEDIUM
    // Flowchart:
    //   normal medium >= 60             → naik hard
    //   normal medium < 60              → focused_remedial medium (1x)
    //   focused_remedial medium >= 60   → naik hard
    //   focused_remedial medium < 60    → turun easy focused_remedial
    // ---------------------------------------------------------------
    private function handleMedium(UserProgressModel $progress, int $score, ?int $weakSubtopicId, ?string $jsonWeakIds): UserProgressModel
    {
        if ($score >= 60) {
            // Lulus medium → naik hard
            $progress->current_level         = 'hard';
            $progress->current_mode          = 'normal';
            $progress->focused_subtopic_id   = null;
            $progress->focused_subtopic_ids  = null;
            $progress->medium_remedial_count = 0;
            $progress->easy_remedial_count   = 0;
            $progress->next_action           = 'start_hard';

            $progress->save();
            return $progress;
        }

        // Gagal
        $progress->focused_subtopic_id   = $weakSubtopicId;
        $progress->focused_subtopic_ids  = $jsonWeakIds;
        $progress->medium_remedial_count = ($progress->medium_remedial_count ?? 0) + 1;

        $isAlreadyInRemedial = $progress->current_mode === 'focused_remedial';

        if ($isAlreadyInRemedial) {
            // Sudah 1x remedial medium, tetap gagal → turun ke easy focused_remedial
            $progress->current_level       = 'easy';
            $progress->current_mode        = 'focused_remedial';
            $progress->easy_remedial_count = 0; // reset, mulai hitung dari easy
            $progress->next_action         = 'repeat_easy_subtopic';
        } else {
            // Pertama kali gagal → remedial 1x di medium
            $progress->current_mode = 'focused_remedial';
            $progress->next_action  = 'repeat_medium_subtopic';
        }

        $progress->save();
        return $progress;
    }

    // ---------------------------------------------------------------
    // HARD
    // Flowchart:
    //   normal hard >= 80               → lulus / next material
    //   normal hard < 80                → focused_remedial hard (1x)
    //   focused_remedial hard >= 80     → lulus
    //   focused_remedial hard < 60      → turun medium focused_remedial
    //   focused_remedial hard 60-79     → turun medium focused_remedial
    //   (semua gagal di hard remedial → turun medium)
    // ---------------------------------------------------------------
    private function handleHard(UserProgressModel $progress, int $score, ?int $weakSubtopicId, ?string $jsonWeakIds): UserProgressModel
    {
        if ($score >= 80) {
            // Lulus hard → selesai
            $progress->status         = 'completed';
            $progress->current_mode   = 'passed';
            $progress->current_level  = null;
            $progress->focused_subtopic_id = null;
            $progress->focused_subtopic_ids = null;
            $progress->completed_practice_at = now();
            $progress->passed_at      = now();
            $progress->next_action    = 'go_next_material';

            $progress->save();
            return $progress;
        }

        // Gagal hard
        $progress->focused_subtopic_id  = $weakSubtopicId;
        $progress->focused_subtopic_ids = $jsonWeakIds;
        $progress->hard_remedial_count  = ($progress->hard_remedial_count ?? 0) + 1;

        $isAlreadyInRemedial = $progress->current_mode === 'focused_remedial';

        if ($isAlreadyInRemedial) {
            // Sudah 1x remedial hard, tetap gagal → turun medium
            $progress->current_level         = 'medium';
            $progress->current_mode          = 'focused_remedial';
            $progress->medium_remedial_count = 0; // reset untuk medium
            $progress->next_action           = 'repeat_medium_subtopic';
        } else {
            // Pertama kali gagal → remedial 1x di hard dulu
            $progress->current_mode = 'focused_remedial';
            $progress->next_action  = 'repeat_hard_subtopic';
        }

        $progress->save();
        return $progress;
    }

    /**
     * Detect weakest subtopic dari attempt tertentu.
     * Return subtopics dengan rata-rata skor di bawah threshold (default 70).
     */
    public function detectWeakSubtopics(int $attemptId): \Illuminate\Support\Collection
    {
        $attempt = PracticeAttemptModel::find($attemptId);
        $level = $attempt->level ?? 'easy';
        $threshold = ($level === 'hard') ? 80 : 60;

        return DB::table('user_practice_answers as upa')
            ->join('practice_questions as pq', 'pq.id', '=', 'upa.practice_questions_id')
            ->select(
                'pq.subtopic_id',
                DB::raw('COUNT(*) as total_questions'),
                DB::raw('SUM(CASE WHEN upa.is_correct = 1 THEN 1 ELSE 0 END) as correct_count'),
                DB::raw('((SUM(CASE WHEN upa.is_correct = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100) as percentage_score')
            )
            ->where('upa.practice_attempts_id', $attemptId)
            ->whereNotNull('pq.subtopic_id')
            ->groupBy('pq.subtopic_id')
            ->having('percentage_score', '<', $threshold)
            ->pluck('pq.subtopic_id');
    }

    /**
     * Hitung skor 0–100 berdasarkan total poin yang didapat
     * dibagi total poin maksimal yang mungkin.
     */
    public function calculateUpdatedWeakSubtopics(UserProgressModel $progress, int $attemptId): array
    {
        $attempt = PracticeAttemptModel::find($attemptId);
        $level = $attempt->level ?? 'easy';
        $threshold = ($level === 'hard') ? 80 : 60;

        $currentWeakIds = json_decode($progress->focused_subtopic_ids ?? '[]', true) 
            ?: ($progress->focused_subtopic_id ? [$progress->focused_subtopic_id] : []);
        
        $attemptResults = DB::table('user_practice_answers as upa')
            ->join('practice_questions as pq', 'pq.id', '=', 'upa.practice_questions_id')
            ->select(
                'pq.subtopic_id', 
                DB::raw('((SUM(CASE WHEN upa.is_correct = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100) as percentage_score')
            )
            ->where('upa.practice_attempts_id', $attemptId)
            ->whereNotNull('pq.subtopic_id')
            ->groupBy('pq.subtopic_id')
            ->get();

        foreach ($attemptResults as $res) {
            $score = (float) $res->percentage_score;
            if ($score >= $threshold) {
                // Passed this subtopic -> remove from list
                $currentWeakIds = array_diff($currentWeakIds, [(int) $res->subtopic_id]);
            } else {
                // Failed this subtopic -> add/keep in list
                if (!in_array((int) $res->subtopic_id, $currentWeakIds)) {
                    $currentWeakIds[] = (int) $res->subtopic_id;
                }
            }
        }

        return array_values(array_unique($currentWeakIds));
    }

    /**
     * Hitung skor 0–100 berdasarkan total poin yang didapat
     * dibagi total poin maksimal yang mungkin.
     */
    public function calculateScore(int $attemptId): int
    {
        $result = DB::table('user_practice_answers as upa')
            ->join('practice_questions as pq', 'pq.id', '=', 'upa.practice_questions_id')
            ->selectRaw('
                SUM(CASE WHEN upa.is_correct = 1 THEN COALESCE(pq.points, 10) ELSE 0 END) as earned,
                SUM(COALESCE(pq.points, 10)) as maximum
            ')
            ->where('upa.practice_attempts_id', $attemptId)
            ->first();

        if (!$result || (int) $result->maximum <= 0) {
            return 0;
        }

        return (int) round(((float) $result->earned / (float) $result->maximum) * 100);
    }
}