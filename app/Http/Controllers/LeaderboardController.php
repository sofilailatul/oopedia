<?php

namespace App\Http\Controllers;

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
        $isMahasiswa = $user->role === 'mahasiswa';
        $isSuperadmin = $user->role === 'superadmin';

        // Available classes for Dosen/Admin
        $availableClasses = collect();
        if (!$isMahasiswa) {
            $classesQuery = DB::table('classes')->orderBy('class_name');
            if (!$isSuperadmin) {
                $classesQuery->where('created_by', $user->id);
            }
            $availableClasses = $classesQuery->get(['id', 'class_name', 'class_code']);
        }

        // Selected Class ID
        $classId = $request->query('class_id');
        if (!$classId) {
            if ($isMahasiswa) {
                $classId = DB::table('class_user')
                    ->where('user_id', $user->id)
                    ->value('class_id');
            } else {
                $classId = $availableClasses->first()?->id;
            }
        }

        if (!$classId) {
            return Inertia::render('Mahasiswa/Leaderboard/Index', [
                'rankings' => [],
                'materials' => [],
                'currentUserId' => $user->id,
                'className' => null,
                'hasClass' => false,
                'authUser' => $user,
                'availableClasses' => $availableClasses,
            ]);
        }

        // Ambil nama kelas
        $classData = DB::table('classes')->where('id', $classId)->first();
        $className = $classData?->class_name;

        // Ambil semua user di kelas ini
        $classmateIds = DB::table('class_user')
            ->where('class_id', $classId)
            ->pluck('user_id');

        $users = UserModel::whereIn('id', $classmateIds)
            ->where('role', 'mahasiswa')
            ->get(['id', 'nama', 'email'])
            ->keyBy('id');

        // Ambil semua materi (tanpa filter dosen)
        $materials = MaterialModel::query()
            ->orderBy('order_number')
            ->get(['id', 'material_name']);

        $materialIds = $materials->pluck('id');

        // --- PRACTICE SCORES per user per material per type/level ---
        $practiceAttempts = DB::table('practice_attempts')
            ->join('practices', 'practices.id', '=', 'practice_attempts.practices_id')
            ->whereIn('practice_attempts.user_id', $classmateIds)
            ->whereNotNull('practice_attempts.finished_at')
            ->whereIn('practices.material_id', $materialIds)
            ->select(
                'practice_attempts.user_id',
                'practices.material_id',
                'practices.level',
                'practice_attempts.attempt_type',
                'practice_attempts.mode',
                DB::raw('MAX(practice_attempts.final_score) as best_score')
            )
            ->groupBy('practice_attempts.user_id', 'practices.material_id', 'practices.level', 'practice_attempts.attempt_type', 'practice_attempts.mode')
            ->get();

        // Struktur: practiceMap[user_id][material_id][key] = best_score
        // key bisa: pretest, easy, normal, hard, remed_easy, remed_normal, remed_hard
        $practiceMap = [];
        foreach ($practiceAttempts as $row) {
            $key = $row->level;
            if ($row->attempt_type === 'pretest') {
                $key = 'pretest';
            } elseif ($row->mode === 'focused_remedial') {
                $key = 'remed_' . $row->level;
            }
            
            $practiceMap[$row->user_id][$row->material_id][$key] = (int) $row->best_score;
        }

        // --- WEAK SUBTOPICS per user per material ---
        $weakSubtopics = DB::table('practice_attempts')
            ->join('practices', 'practices.id', '=', 'practice_attempts.practices_id')
            ->join('subtopics', 'subtopics.id', '=', 'practice_attempts.focused_subtopic_id')
            ->whereIn('practice_attempts.user_id', $classmateIds)
            ->whereNotNull('practice_attempts.finished_at')
            ->where('practice_attempts.mode', 'focused_remedial')
            ->whereIn('practices.material_id', $materialIds)
            ->select(
                'practice_attempts.user_id',
                'practices.material_id',
                'subtopics.name as subtopic_name'
            )
            ->distinct()
            ->get();

        $weakMap = [];
        foreach ($weakSubtopics as $ws) {
            $weakMap[$ws->user_id][$ws->material_id][] = $ws->subtopic_name;
        }

        // --- QUIZ SCORES per user per material (untuk kolom quiz di tabel latihan) ---
        $quizScores = DB::table('quiz_attempt_material_scores')
            ->join('quiz_attempts', 'quiz_attempts.id', '=', 'quiz_attempt_material_scores.quiz_attempts_id')
            ->join('quizzes', 'quizzes.id', '=', 'quiz_attempts.quizzes_id')
            ->whereIn('quiz_attempts.user_id', $classmateIds)
            ->where('quizzes.class_id', $classId)
            ->whereNotNull('quiz_attempts.finished_at')
            ->whereIn('quiz_attempt_material_scores.material_id', $materialIds)
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

        // --- QUIZ ATTEMPTS detail per user (untuk tabel kuis terpisah) ---
        // Ambil semua attempt kuis yang sudah selesai, dengan nilai tiap materi
        $quizAttemptRows = DB::table('quiz_attempts')
            ->join('quizzes', 'quizzes.id', '=', 'quiz_attempts.quizzes_id')
            ->whereIn('quiz_attempts.user_id', $classmateIds)
            ->where('quizzes.class_id', $classId)
            ->whereNotNull('quiz_attempts.finished_at')
            ->select(
                'quiz_attempts.id as attempt_id',
                'quiz_attempts.user_id',
                'quiz_attempts.quizzes_id',
                'quiz_attempts.total_score',
                'quiz_attempts.finished_at',
                'quizzes.title as quiz_title'
            )
            ->orderBy('quiz_attempts.finished_at')
            ->get();

        $quizAttemptIds = $quizAttemptRows->pluck('attempt_id');

        // Ambil nilai per-materi untuk setiap attempt
        $materialScoreRows = collect();
        if ($quizAttemptIds->isNotEmpty()) {
            $materialScoreRows = DB::table('quiz_attempt_material_scores')
                ->whereIn('quiz_attempts_id', $quizAttemptIds)
            ->whereIn('material_id', $materialIds)
                ->select('quiz_attempts_id', 'material_id', 'earned_score')
                ->get();
        }

        // Group material scores by attempt_id
        $materialScoreByAttempt = $materialScoreRows->groupBy('quiz_attempts_id');

        // Susun quizAttemptsMap[user_id] = [ {quiz_title, total_score, materials:[{material_id, score}]} ]
        $quizAttemptsMap = [];
        // Ambil attempt terakhir per user per kuis
        $latestAttemptPerUserQuiz = [];
        foreach ($quizAttemptRows as $row) {
            $key = $row->user_id . '-' . $row->quizzes_id;
            // Karena sudah order by finished_at, selalu timpa dengan yang lebih baru
            $latestAttemptPerUserQuiz[$key] = $row;
        }

        foreach ($latestAttemptPerUserQuiz as $row) {
            $matScores = $materialScoreByAttempt->get($row->attempt_id, collect());
            $materialsArr = $matScores->map(fn($ms) => [
                'material_id' => $ms->material_id,
                'score'       => (int) $ms->earned_score,
            ])->values()->all();

            $quizAttemptsMap[$row->user_id][] = [
                'quiz_title'  => $row->quiz_title,
                'total_score' => (int) $row->total_score,
                'materials'   => $materialsArr,
            ];
        }

        // Build rankings
        $rankings = [];
        foreach ($users as $u) {
            $totalScore = 0;
            $materialBreakdown = [];

            foreach ($materials as $mat) {
                $pretest = $practiceMap[$u->id][$mat->id]['pretest'] ?? 0;
                
                $easyNormal = $practiceMap[$u->id][$mat->id]['easy'] ?? 0;
                $easyRemed  = $practiceMap[$u->id][$mat->id]['remed_easy'] ?? 0;
                
                $mediumNormal = $practiceMap[$u->id][$mat->id]['medium'] ?? ($practiceMap[$u->id][$mat->id]['normal'] ?? 0);
                $mediumRemed  = $practiceMap[$u->id][$mat->id]['remed_medium'] ?? ($practiceMap[$u->id][$mat->id]['remed_normal'] ?? 0);
                
                $hardNormal = $practiceMap[$u->id][$mat->id]['hard'] ?? 0;
                $hardRemed  = $practiceMap[$u->id][$mat->id]['remed_hard'] ?? 0;
                
                $quizScore = $quizMap[$u->id][$mat->id] ?? 0;

                // Total per material: hanya mode normal (easy + medium + hard).
                // Pretest, kuis, dan remedial TIDAK dihitung ke total.
                $materialTotal = $easyNormal
                                + $mediumNormal
                                + $hardNormal;

                $totalScore += $materialTotal;

                $materialBreakdown[] = [
                    'material_id' => $mat->id,
                    'pretest' => $pretest,
                    'easy' => $easyNormal,
                    'remed_easy' => $easyRemed,
                    'normal' => $mediumNormal,
                    'remed_normal' => $mediumRemed,
                    'hard' => $hardNormal,
                    'remed_hard' => $hardRemed,
                    'quiz' => $quizScore,
                    'total' => $materialTotal,
                    'weak_subtopics' => $weakMap[$u->id][$mat->id] ?? [],
                ];
            }

            $rankings[] = [
                'user_id'      => $u->id,
                'nama'         => $u->nama,
                'email'        => $u->email,
                'total_score'  => $totalScore,
                'materials'    => $materialBreakdown,
                'quiz_attempts'=> $quizAttemptsMap[$u->id] ?? [],
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
            'hasClass' => true,
            'authUser' => $user,
            'availableClasses' => $availableClasses,
            'selectedClassId' => (int) $classId,
        ]);
    }

    private function resolvePracticeStatus($lastAttempt): string
    {
        if (!$lastAttempt) {
            return 'Belum mulai';
        }

        if (!empty($lastAttempt->next_action)) {
            return match ($lastAttempt->next_action) {
                'go_easy' => 'Sedang Easy',
                'go_medium' => 'Sedang Medium',
                'go_normal' => 'Sedang Medium',
                'go_hard' => 'Sedang Hard',
                'remedial_easy' => 'Remedial Easy',
                'remedial_medium' => 'Remedial Medium',
                'remedial_normal' => 'Remedial Medium',
                'remedial_hard' => 'Remedial Hard',
                'review_material' => 'Perlu baca ulang',
                'completed' => 'Lulus',
                default => $lastAttempt->next_action,
            };
        }

        if ((bool) $lastAttempt->is_passed) {
            if ($lastAttempt->level === 'hard') {
                return 'Lulus';
            }

            if ($lastAttempt->level === 'easy') {
                return 'Sedang Medium';
            }

            if ($lastAttempt->level === 'medium' || $lastAttempt->level === 'normal') {
                return 'Sedang Hard';
            }
        }

        if ($lastAttempt->mode === 'focused_remedial') {
            return 'Remedial ' . ucfirst($lastAttempt->level ?? '');
        }

        if ($lastAttempt->level) {
            return 'Sedang ' . ucfirst($lastAttempt->level);
        }

        return 'Sedang latihan';
    }

    private function buildStudentMaterialStats(int $studentId, $materials)
        {
            $attemptRows = DB::table('practice_attempts')
                ->join('practices', 'practices.id', '=', 'practice_attempts.practices_id')
                ->leftJoin('subtopics', 'subtopics.id', '=', 'practice_attempts.focused_subtopic_id')
                ->where('practice_attempts.user_id', $studentId)
            ->whereNotNull('practice_attempts.finished_at')
            ->select(
                'practices.material_id',
                'practice_attempts.attempt_type',
                'practice_attempts.level',
                'practice_attempts.mode',
                'practice_attempts.focused_subtopic_id',
                'practice_attempts.final_score',
                'practice_attempts.is_passed',
                'practice_attempts.next_action',
                'practice_attempts.finished_at',
                'subtopics.name as subtopic_name'
            )
            ->orderBy('practice_attempts.finished_at')
            ->get();

        $stats = [];

        foreach ($materials as $material) {
            $stats[$material->id] = [
                'material_id' => $material->id,
                'material_name' => $material->material_name,

                'pretest' => 0,

                'easy' => 0,
                'remed_easy' => 0,

                'medium' => 0,
                'remed_medium' => 0,

                'hard' => 0,
                'remed_hard' => 0,

                'weak_easy_subtopics' => [],
                'weak_medium_subtopics' => [],
                'weak_hard_subtopics' => [],

                'quiz' => 0,
                'total' => 0,

                'status' => 'Belum mulai',
                '_last_attempt' => null,
            ];
        }

        foreach ($attemptRows as $row) {
            if (!isset($stats[$row->material_id])) {
                continue;
            }

            $score = (int) ($row->final_score ?? 0);
            $level = $row->level;
            $mode = $row->mode;
            $attemptType = $row->attempt_type;

            if ($attemptType === 'pretest') {
                $stats[$row->material_id]['pretest'] = max(
                    $stats[$row->material_id]['pretest'],
                    $score
                );
            }

            if ($attemptType === 'practice' && $mode === 'normal') {
                if ($level === 'easy') {
                    $stats[$row->material_id]['easy'] = max($stats[$row->material_id]['easy'], $score);
                }

                if ($level === 'medium' || $level === 'normal') {
                    $stats[$row->material_id]['medium'] = max($stats[$row->material_id]['medium'], $score);
                }

                if ($level === 'hard') {
                    $stats[$row->material_id]['hard'] = max($stats[$row->material_id]['hard'], $score);
                }
            }

            if ($attemptType === 'practice' && $mode === 'focused_remedial') {
                $remedKey = 'remed_' . ($level === 'normal' ? 'medium' : $level);
                $weakKey = 'weak_' . ($level === 'normal' ? 'medium' : $level) . '_subtopics';
                
                $stats[$row->material_id][$remedKey] = max($stats[$row->material_id][$remedKey], $score);

                if ($row->subtopic_name) {
                    $stats[$row->material_id][$weakKey][$row->focused_subtopic_id] = $row->subtopic_name;
                }
            }

            $stats[$row->material_id]['_last_attempt'] = $row;
        }

        // --- QUIZ SCORES per material for this student ---
        $quizScores = DB::table('quiz_attempt_material_scores')
            ->join('quiz_attempts', 'quiz_attempts.id', '=', 'quiz_attempt_material_scores.quiz_attempts_id')
            ->where('quiz_attempts.user_id', $studentId)
            ->whereNotNull('quiz_attempts.finished_at')
            ->select(
                'quiz_attempt_material_scores.material_id',
                DB::raw('SUM(quiz_attempt_material_scores.earned_score) as total_quiz_score')
            )
            ->groupBy('quiz_attempt_material_scores.material_id')
            ->get();

        foreach ($quizScores as $qs) {
            if (isset($stats[$qs->material_id])) {
                $stats[$qs->material_id]['quiz'] = (int) $qs->total_quiz_score;
            }
        }

        foreach ($stats as $materialId => $row) {
            $lastAttempt = $row['_last_attempt'];

            // Convert weak subtopic associative arrays to flat arrays
            foreach (['easy', 'medium', 'hard'] as $lvl) {
                $wkKey = "weak_{$lvl}_subtopics";
                if (isset($row[$wkKey]) && is_array($row[$wkKey])) {
                    $stats[$materialId][$wkKey] = array_values($row[$wkKey]);
                } else {
                    $stats[$materialId][$wkKey] = [];
                }
            }

            // Calculate Total: hanya mode normal (pretest + easy + medium + hard).
            // Kuis dan remedial TIDAK dihitung ke total.
            $stats[$materialId]['total'] = $row['pretest']
                + $row['easy']
                + $row['medium']
                + $row['hard'];

            $stats[$materialId]['status'] = $this->resolvePracticeStatus($lastAttempt);

            unset($stats[$materialId]['_last_attempt']);
        }

        return array_values($stats);
    }

    private function buildStudentQuizStats(int $studentId, int $classId)
    {
        $attempts = QuizAttemptModel::query()
            ->with([
                'quiz:id,title,class_id',
                'materialScores.material:id,material_name',
            ])
            ->where('user_id', $studentId)
            ->whereNotNull('finished_at')
            ->whereHas('quiz', function ($query) use ($classId) {
                $query->where('class_id', $classId);
            })
            ->orderBy('finished_at')
            ->get();

        return $attempts->map(function ($attempt) {
            $materials = $attempt->materialScores->map(function ($score) {
                return [
                    'material_id' => $score->material_id,
                    'material_name' => $score->material?->material_name ?? 'Materi tidak ditemukan',
                    'score' => (int) ($score->earned_score ?? 0),
                    'max_score' => (int) ($score->max_score ?? 0),
                    'percentage' => (float) ($score->percentage ?? 0),
                ];
            })->values();

            return [
                'quiz_id' => $attempt->quizzes_id,
                'quiz_title' => $attempt->quiz?->title ?? 'Quiz',
                'attempt_id' => $attempt->id,
                'materials' => $materials,
                'total_score' => (int) ($attempt->total_score ?? $materials->sum('score')),
                'finished_at' => $attempt->finished_at,
            ];
        })->values();
    }

    public function studentDetail(Request $request, int $classId, int $studentId)
    {
        $classInfo = DB::table('classes')
            ->where('id', $classId)
            ->first();

        $student = UserModel::query()
            ->where('id', $studentId)
            ->firstOrFail(['id', 'nama', 'email']);

        $isStudentInClass = DB::table('class_user')
            ->where('class_id', $classId)
            ->where('user_id', $studentId)
            ->exists();

        abort_unless($isStudentInClass, 404);

        $materials = MaterialModel::query()
            ->orderBy('order_number')
            ->get(['id', 'material_name']);

        $materialStats = $this->buildStudentMaterialStats(
            studentId: $studentId,
            materials: $materials
        );

        $quizStats = $this->buildStudentQuizStats(
            studentId: $studentId,
            classId: $classId
        );

        return Inertia::render('ManageLeaderboard/Show', [
            'class' => [
                'id' => $classInfo->id,
                'class_name' => $classInfo->class_name,
                'class_code' => $classInfo->class_code ?? null,
            ],
            'student' => [
                'id' => $student->id,
                'nama' => $student->nama,
                'email' => $student->email,
            ],
            'materialStats' => $materialStats,
            'quizStats' => $quizStats,
        ]);
    }
}


