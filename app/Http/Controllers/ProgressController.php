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
                'materials',
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

            // Practice summary per student (best final_score across class materials, all levels)
            $materialIds = $class->materials->pluck('id');
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

        $classQuery = ClassModel::with(['materials', 'users' => function ($q) {
            $q->where('role', 'mahasiswa');
        }]);

        if (! $isSuperadmin) {
            $classQuery->where('created_by', $lecturer->id);
        }

        $class = $classQuery->findOrFail($classId);

        $isMember = $class->users->contains('id', $student->id);
        abort_unless($isMember, 404);

        // Build per-material summary (easy/normal/hard/quiz) for this student
        $practiceScores = DB::table('practice_attempts')
            ->join('practices', 'practices.id', '=', 'practice_attempts.practices_id')
            ->join('materials', 'materials.id', '=', 'practices.material_id')
            ->where('practice_attempts.user_id', $student->id)
            ->whereNotNull('practice_attempts.finished_at')
            ->when(! $isSuperadmin, function ($q) use ($lecturer) {
                $q->where('materials.created_by', $lecturer->id);
            })
            ->select(
                'practices.material_id',
                'practices.level',
                DB::raw('MAX(practice_attempts.final_score) as best_score')
            )
            ->groupBy('practices.material_id', 'practices.level')
            ->get();

        $practiceMap = [];
        foreach ($practiceScores as $row) {
            $practiceMap[$row->material_id][$row->level] = (int) $row->best_score;
        }

        $quizScores = DB::table('quiz_attempt_material_scores')
            ->join('quiz_attempts', 'quiz_attempts.id', '=', 'quiz_attempt_material_scores.quiz_attempts_id')
            ->join('materials', 'materials.id', '=', 'quiz_attempt_material_scores.material_id')
            ->where('quiz_attempts.user_id', $student->id)
            ->whereNotNull('quiz_attempts.finished_at')
            ->when(! $isSuperadmin, function ($q) use ($lecturer) {
                $q->where('materials.created_by', $lecturer->id);
            })
            ->select(
                'quiz_attempt_material_scores.material_id',
                DB::raw('SUM(quiz_attempt_material_scores.earned_score) as total_quiz_score')
            )
            ->groupBy('quiz_attempt_material_scores.material_id')
            ->get();

        $quizMap = [];
        foreach ($quizScores as $row) {
            $quizMap[$row->material_id] = (int) $row->total_quiz_score;
        }

        $materialIds = collect(array_merge(
            array_keys($practiceMap),
            array_keys($quizMap)
        ))->unique()->values();

        $materials = MaterialModel::whereIn('id', $materialIds)
            ->orderBy('order_number')
            ->get(['id', 'material_name']);

        $materialStats = [];
        foreach ($materials as $mat) {
            $easy   = $practiceMap[$mat->id]['easy'] ?? 0;
            $normal = $practiceMap[$mat->id]['normal'] ?? 0;
            $hard   = $practiceMap[$mat->id]['hard'] ?? 0;
            $quiz   = $quizMap[$mat->id] ?? 0;

            $total  = $easy + $normal + $hard + $quiz;

            $materialStats[] = [
                'material_id' => $mat->id,
                'material_name' => $mat->material_name,
                'easy' => $easy,
                'normal' => $normal,
                'hard' => $hard,
                'quiz' => $quiz,
                'total' => $total,
            ];
        }

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
            'backRouteName' => $backRouteName,
            'authUser' => $lecturer,
        ]);
    }
}
