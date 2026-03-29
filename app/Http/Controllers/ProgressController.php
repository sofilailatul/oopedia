<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\ClassModel;
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

        $classes = ClassModel::withCount([
            'users as students_count' => function ($q) {
                $q->where('role', 'mahasiswa');
            },
        ])
            ->where('created_by', $user->id)
            ->orderBy('class_name')
            ->get(['id', 'class_name', 'class_code']);

        $selectedClassId = $request->integer('class_id') ?: ($classes->first()->id ?? null);
        $classDetail = null;

        if ($selectedClassId) {
            $class = ClassModel::with([
                'users' => function ($q) {
                $q->where('role', 'mahasiswa')
                    ->orderBy('nama');
                },
                'materials',
            ])
                ->where('created_by', $user->id)
                ->findOrFail($selectedClassId);

            $quizzes = QuizModel::where('class_id', $class->id)
                ->where('created_by', $user->id)
                ->orderBy('id')
                ->get(['id', 'title']);

            $studentIds = $class->users->pluck('id');
            $quizIds = $quizzes->pluck('id');

            // Hard-level practice summary per student (best final_score across class materials)
            $materialIds = $class->materials->pluck('id');
            $hardMap = [];

            if ($studentIds->isNotEmpty() && $materialIds->isNotEmpty()) {
                $hardScores = DB::table('practice_attempts')
                    ->join('practices', 'practices.id', '=', 'practice_attempts.practices_id')
                    ->whereIn('practice_attempts.user_id', $studentIds)
                    ->where('practices.difficulty_level', 'hard')
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

        return Inertia::render('Dosen/Leaderboard/Index', [
            'classes' => $classes,
            'selectedClassId' => $selectedClassId,
            'classDetail' => $classDetail,
        ]);
    }

    public function dosenStudentDetailPage(Request $request, UserModel $student)
    {
        $lecturer = $request->user();
        $classId = $request->integer('class_id');

        if (!$classId) {
            abort(404);
        }

        $class = ClassModel::with(['materials', 'users' => function ($q) {
            $q->where('role', 'mahasiswa');
        }])
            ->where('created_by', $lecturer->id)
            ->findOrFail($classId);

        $isMember = $class->users->contains('id', $student->id);
        abort_unless($isMember, 404);

        $materialIds = $class->materials->pluck('id');
        $attemptsByLevel = [
            'easy' => [],
            'normal' => [],
            'hard' => [],
        ];

        if ($materialIds->isNotEmpty()) {
            $attempts = PracticeAttemptModel::where('user_id', $student->id)
                ->whereHas('practice', function ($q) use ($materialIds) {
                    $q->whereIn('material_id', $materialIds);
                })
                ->with(['practice' => function ($q) {
                    $q->select('id', 'material_id', 'difficulty_level');
                }])
                ->whereNotNull('finished_at')
                ->orderBy('finished_at')
                ->get(['id', 'user_id', 'practices_id', 'finished_at', 'final_score']);

            foreach ($attempts as $attempt) {
                $level = $attempt->practice->difficulty_level ?? 'normal';
                if (!array_key_exists($level, $attemptsByLevel)) {
                    $attemptsByLevel[$level] = [];
                }

                $attemptsByLevel[$level][] = [
                    'id' => $attempt->id,
                    'score' => (int) $attempt->final_score,
                    'finished_at' => optional($attempt->finished_at)->toDateTimeString(),
                ];
            }
        }

        return Inertia::render('Dosen/Leaderboard/Show', [
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
            'attemptsByLevel' => $attemptsByLevel,
        ]);
    }
}
