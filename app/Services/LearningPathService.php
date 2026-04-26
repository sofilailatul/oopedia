<?php

namespace App\Services;

use App\Models\UserProgressModel;
use App\Models\PracticeAttemptModel;
use Illuminate\Support\Facades\DB;

class LearningPathService
{
    public function handlePretest(UserProgressModel $progress, int $score, ?int $weakSubtopicId): UserProgressModel
    {
        $progress->pretest_score = $score;
        $progress->last_score    = $score;
        $progress->focused_subtopic_id = null; // pretest belum ada remedial

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
        $weakSubtopicId = $attempt->focused_subtopic_id;

        $progress->last_score = $score;

        return match ($level) {
            'easy'   => $this->handleEasy($progress, $score, $weakSubtopicId),
            'medium' => $this->handleMedium($progress, $score, $weakSubtopicId),
            'hard'   => $this->handleHard($progress, $score, $weakSubtopicId),
            default  => $progress,
        };
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
    private function handleEasy(UserProgressModel $progress, int $score, ?int $weakSubtopicId): UserProgressModel
    {
        if ($score >= 60) {
            // Lulus easy → naik medium
            $progress->current_level         = 'medium';
            $progress->current_mode          = 'normal';
            $progress->focused_subtopic_id   = null;
            $progress->easy_remedial_count   = 0;
            $progress->next_action           = 'start_medium';

            $progress->save();
            return $progress;
        }

        // Gagal — naikkan counter remedial
        $progress->focused_subtopic_id = $weakSubtopicId;
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
    private function handleMedium(UserProgressModel $progress, int $score, ?int $weakSubtopicId): UserProgressModel
    {
        if ($score >= 60) {
            // Lulus medium → naik hard
            $progress->current_level         = 'hard';
            $progress->current_mode          = 'normal';
            $progress->focused_subtopic_id   = null;
            $progress->medium_remedial_count = 0;
            $progress->easy_remedial_count   = 0;
            $progress->next_action           = 'start_hard';

            $progress->save();
            return $progress;
        }

        // Gagal
        $progress->focused_subtopic_id   = $weakSubtopicId;
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
    private function handleHard(UserProgressModel $progress, int $score, ?int $weakSubtopicId): UserProgressModel
    {
        if ($score >= 80) {
            // Lulus hard → selesai
            $progress->status         = 'completed';
            $progress->current_mode   = 'passed';
            $progress->current_level  = null;
            $progress->focused_subtopic_id = null;
            $progress->completed_practice_at = now();
            $progress->passed_at      = now();
            $progress->next_action    = 'go_next_material';

            $progress->save();
            return $progress;
        }

        // Gagal hard
        $progress->focused_subtopic_id  = $weakSubtopicId;
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
     * Return subtopic dengan rata-rata skor terendah.
     */
    public function detectWeakSubtopic(int $attemptId): ?object
    {
        return DB::table('user_practice_answers as upa')
            ->join('practice_questions as pq', 'pq.id', '=', 'upa.practice_questions_id')
            ->select(
                'pq.subtopic_id',
                DB::raw('SUM(upa.score) as total_score'),
                DB::raw('COUNT(*) as total_questions'),
                DB::raw('SUM(CASE WHEN upa.is_correct = 1 THEN 1 ELSE 0 END) as correct_count'),
                DB::raw('ROUND(AVG(upa.score), 2) as avg_score')
            )
            ->where('upa.practice_attempts_id', $attemptId)
            ->whereNotNull('pq.subtopic_id')
            ->groupBy('pq.subtopic_id')
            ->orderBy('avg_score', 'asc')   // subtopic dengan rata-rata terendah = paling lemah
            ->orderBy('correct_count', 'asc')
            ->first();
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