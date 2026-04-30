<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\ClassModel;
use App\Models\MaterialModel;
use App\Models\PracticeAttemptModel;
use App\Models\QuizAttemptModel;
use App\Models\QuizModel;
use App\Models\UserModel;
use App\Models\UserProgressModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProgressController extends Controller
{
    public function myProgress(Request $request)
    {
        $user = $request->user();

        $progress = UserProgressModel::with(['material', 'class'])
            ->where('user_id', $user->id)
            ->orderBy('id')
            ->get();

        return response()->json($progress);
    }

    public function dosenClassScoresPage(Request $request)
    {
        $user = $request->user();

        $isSuperadmin = $user->role === 'superadmin';

        $classesQuery = ClassModel::withCount([
            'users as students_count' => function ($q) {
                $q->where('role', 'mahasiswa');
            },
        ])
            ->orderBy('class_name');

        if (! $isSuperadmin) {
            $classesQuery->where('created_by', $user->id);
        }

        $classes = $classesQuery->get(['id', 'class_name', 'class_code']);

        $selectedClassId = $request->integer('class_id') ?: ($classes->first()->id ?? null);
        $classDetail = null;

        if ($selectedClassId) {
            $classQuery = ClassModel::with([
                'users' => function ($q) {
                    $q->where('role', 'mahasiswa')
                        ->orderBy('nama');
                },
            ]);

            if (! $isSuperadmin) {
                $classQuery->where('created_by', $user->id);
            }

            $class = $classQuery->findOrFail($selectedClassId);

            $quizzes = QuizModel::where('class_id', $class->id)
                ->where('created_by', $user->id)
                ->orderBy('id')
                ->get(['id', 'title']);

            $studentIds = $class->users->pluck('id');
            $quizIds = $quizzes->pluck('id');

            // Practice summary per student (best final_score across all materials, all levels)
            $materialIds = \App\Models\MaterialModel::pluck('id');
            $hardMap = [];

            if ($studentIds->isNotEmpty() && $materialIds->isNotEmpty()) {
                $hardScores = DB::table('practice_attempts')
                    ->join('practices', 'practices.id', '=', 'practice_attempts.practices_id')
                    ->whereIn('practice_attempts.user_id', $studentIds)
                    ->whereIn('practices.material_id', $materialIds)
                    ->whereNotNull('practice_attempts.finished_at')
                    ->select('practice_attempts.user_id', DB::raw('MAX(practice_attempts.final_score) as best_score'))
                    ->groupBy('practice_attempts.user_id')
                    ->get();

                foreach ($hardScores as $row) {
                    $hardMap[$row->user_id] = (int) $row->best_score;
                }
            }

            $latestAttempts = collect();
            if ($studentIds->isNotEmpty() && $quizIds->isNotEmpty()) {
                $attempts = QuizAttemptModel::whereIn('user_id', $studentIds)
                    ->whereIn('quizzes_id', $quizIds)
                    ->whereNotNull('finished_at')
                    ->orderBy('finished_at')
                    ->get(['id', 'user_id', 'quizzes_id', 'total_score', 'finished_at']);

                $latestAttempts = $attempts->groupBy(function ($attempt) {
                    return $attempt->user_id . '-' . $attempt->quizzes_id;
                })->map(function ($group) {
                    return $group->last();
                });
            }

            $students = $class->users->map(function ($student) use ($quizzes, $latestAttempts, $hardMap) {
                $perQuiz = [];
                $totalScore = 0;
                $completedCount = 0;

                foreach ($quizzes as $quiz) {
                    $key = $student->id . '-' . $quiz->id;
                    $attempt = $latestAttempts->get($key);
                    $score = $attempt ? $attempt->total_score : null;

                    $perQuiz[] = [
                        'quiz_id' => $quiz->id,
                        'score' => $score,
                    ];

                    if ($score !== null) {
                        $totalScore += $score;
                        $completedCount++;
                    }
                }

                $average = $completedCount > 0 ? round($totalScore / $completedCount, 1) : null;
                $hardScore = $hardMap[$student->id] ?? null;

                return [
                    'id' => $student->id,
                    'nama' => $student->nama,
                    'email' => $student->email,
                    'hard_score' => $hardScore,
                    'average_score' => $average,
                    'completed_quizzes' => $completedCount,
                    'scores' => $perQuiz,
                ];
            });

            $classDetail = [
                'id' => $class->id,
                'class_name' => $class->class_name,
                'class_code' => $class->class_code,
                'quizzes' => $quizzes->map(function ($quiz) {
                    return [
                        'id' => $quiz->id,
                        'title' => $quiz->title,
                    ];
                })->values(),
                'students' => $students->values(),
            ];
        }

        return Inertia::render('ManageLeaderboard/Index', [
            'classes' => $classes,
            'selectedClassId' => $selectedClassId,
            'classDetail' => $classDetail,
            'authUser' => $user,
        ]);
    }

    public function dosenStudentDetailPage(Request $request, UserModel $student)
    {
        $lecturer = $request->user();
        $classId = $request->integer('class_id');

        if (!$classId) {
            abort(404);
        }

        $isSuperadmin = $lecturer->role === 'superadmin';

        $classQuery = ClassModel::with(['users' => function ($q) {
            $q->where('role', 'mahasiswa');
        }]);

        if (! $isSuperadmin) {
            $classQuery->where('created_by', $lecturer->id);
        }

        $class = $classQuery->findOrFail($classId);

        $isMember = $class->users->contains('id', $student->id);
        abort_unless($isMember, 404);

        // Build per-material summary (pretest/easy/normal/hard/quiz) for this student
        $materialsList = MaterialModel::query()
            ->orderBy('order_number')
            ->get(['id', 'material_name']);

        $materialStats = $this->buildStudentMaterialStats($student->id, $materialsList);

        $quizStats = $this->buildStudentQuizStats($student->id, $class->id);

        $backRouteName = $isSuperadmin ? 'grades.index' : 'dosen.grades.index';

        return Inertia::render('ManageLeaderboard/Show', [
            'class' => [
                'id' => $class->id,
                'class_name' => $class->class_name,
                'class_code' => $class->class_code,
            ],
            'student' => [
                'id' => $student->id,
                'nama' => $student->nama,
                'email' => $student->email,
            ],
            'materialStats' => $materialStats,
            'quizStats' => $quizStats,
            'backRouteName' => $backRouteName,
            'authUser' => $lecturer,
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

            // Calculate Total
            $stats[$materialId]['total'] = $row['pretest'] 
                + max($row['easy'], $row['remed_easy']) 
                + max($row['medium'], $row['remed_medium']) 
                + max($row['hard'], $row['remed_hard']) 
                + ($stats[$materialId]['quiz'] ?? 0);

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
}
