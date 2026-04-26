<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\PracticeAttemptModel;
use App\Models\QuizAttemptModel;
use App\Models\UserModel;
use App\Models\MaterialModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LeaderboardController extends Controller
{
    // total final_score practice per user
    public function practice(Request $request)
    {
        $limit = (int) ($request->query('limit', 20));

        $rows = PracticeAttemptModel::select('user_id', DB::raw('SUM(final_score) as total_practice_score'))
            ->whereNotNull('user_id')
            ->groupBy('user_id')
            ->orderByDesc('total_practice_score')
            ->limit($limit)
            ->get();

        $users = UserModel::whereIn('id', $rows->pluck('user_id'))->get()->keyBy('id');

        return response()->json($rows->map(fn ($r) => [
            'user_id' => $r->user_id,
            'nama' => $users[$r->user_id]->nama ?? null,
            'score' => (int) $r->total_practice_score,
        ]));
    }

    // total quiz score per user
    public function quiz(Request $request)
    {
        $limit = (int) ($request->query('limit', 20));

        $rows = QuizAttemptModel::select('user_id', DB::raw('SUM(total_score) as total_quiz_score'))
            ->whereNotNull('user_id')
            ->groupBy('user_id')
            ->orderByDesc('total_quiz_score')
            ->limit($limit)
            ->get();

        $users = UserModel::whereIn('id', $rows->pluck('user_id'))->get()->keyBy('id');

        return response()->json($rows->map(fn ($r) => [
            'user_id' => $r->user_id,
            'nama' => $users[$r->user_id]->nama ?? null,
            'score' => (int) $r->total_quiz_score,
        ]));
    }

    // combined practice + quiz — Inertia page
    public function combined(Request $request)
    {
        $user = $request->user();

        // Ambil class_id user saat ini
        $classId = DB::table('class_user')
            ->where('user_id', $user->id)
            ->value('class_id');

        if (!$classId) {
            return Inertia::render('Mahasiswa/Leaderboard/Index', [
                'rankings' => [],
                'materials' => [],
                'currentUserId' => $user->id,
                'className' => null,
            ]);
        }

        // Ambil nama kelas
        $className = DB::table('classes')->where('id', $classId)->value('class_name');

        // Ambil semua user di kelas ini
        $classmateIds = DB::table('class_user')
            ->where('class_id', $classId)
            ->pluck('user_id');

        $users = UserModel::whereIn('id', $classmateIds)
            ->where('role', 'mahasiswa')
            ->get(['id', 'nama', 'email'])
            ->keyBy('id');

        // Ambil semua materi
        $materials = MaterialModel::orderBy('order_number')->get(['id', 'material_name']);

        // --- PRACTICE SCORES per user per material per difficulty ---
        $practiceScores = DB::table('practice_attempts')
            ->join('practices', 'practices.id', '=', 'practice_attempts.practices_id')
            ->whereIn('practice_attempts.user_id', $classmateIds)
            ->whereNotNull('practice_attempts.finished_at')
            ->select(
                'practice_attempts.user_id',
                'practices.material_id',
                'practices.level',
                DB::raw('MAX(practice_attempts.final_score) as best_score')
            )
            ->groupBy('practice_attempts.user_id', 'practices.material_id', 'practices.level')
            ->get();

        // Struktur: practiceMap[user_id][material_id][difficulty] = best_score
        $practiceMap = [];
        foreach ($practiceScores as $row) {
            $practiceMap[$row->user_id][$row->material_id][$row->level] = (int) $row->best_score;
        }

        // --- QUIZ SCORES per user per material ---
        $quizScores = DB::table('quiz_attempt_material_scores')
            ->join('quiz_attempts', 'quiz_attempts.id', '=', 'quiz_attempt_material_scores.quiz_attempts_id')
            ->whereIn('quiz_attempts.user_id', $classmateIds)
            ->whereNotNull('quiz_attempts.finished_at')
            ->select(
                'quiz_attempts.user_id',
                'quiz_attempt_material_scores.material_id',
                DB::raw('SUM(quiz_attempt_material_scores.earned_score) as total_quiz_score')
            )
            ->groupBy('quiz_attempts.user_id', 'quiz_attempt_material_scores.material_id')
            ->get();

        // Struktur: quizMap[user_id][material_id] = total_quiz_score
        $quizMap = [];
        foreach ($quizScores as $row) {
            $quizMap[$row->user_id][$row->material_id] = (int) $row->total_quiz_score;
        }

        // Build rankings
        $rankings = [];
        foreach ($users as $u) {
            $totalScore = 0;
            $materialBreakdown = [];

            foreach ($materials as $mat) {
                $easy   = $practiceMap[$u->id][$mat->id]['easy'] ?? 0;
                $normal = $practiceMap[$u->id][$mat->id]['normal'] ?? 0;
                $hard   = $practiceMap[$u->id][$mat->id]['hard'] ?? 0;
                $quizScore = $quizMap[$u->id][$mat->id] ?? 0;

                $materialTotal = $easy + $normal + $hard + $quizScore;
                $totalScore += $materialTotal;

                $materialBreakdown[] = [
                    'material_id' => $mat->id,
                    'easy' => $easy,
                    'normal' => $normal,
                    'hard' => $hard,
                    'quiz' => $quizScore,
                    'total' => $materialTotal,
                ];
            }

            $rankings[] = [
                'user_id' => $u->id,
                'nama' => $u->nama,
                'email' => $u->email,
                'total_score' => $totalScore,
                'materials' => $materialBreakdown,
            ];
        }

        // Sort by total_score desc, assign rank
        usort($rankings, fn($a, $b) => $b['total_score'] <=> $a['total_score']);
        foreach ($rankings as $i => &$r) {
            $r['rank'] = $i + 1;
        }

        return Inertia::render('Mahasiswa/Leaderboard/Index', [
            'rankings' => $rankings,
            'materials' => $materials->map(fn($m) => [
                'id' => $m->id,
                'name' => $m->material_name,
            ])->values(),
            'currentUserId' => $user->id,
            'className' => $className,
        ]);
    }
}
