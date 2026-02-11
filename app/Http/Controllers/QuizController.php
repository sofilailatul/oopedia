<?php

namespace App\Http\Controllers;

use App\Models\QuizModel;
use App\Models\QuizAttemptModel;
use App\Models\UserQuizAnswerModel;
use App\Models\QuizQuestionsModel;
use App\Models\QuizOptionModel;
use App\Models\QuizMapModel;
use App\Models\UserProgressModel;
use App\Models\QuizAttemptMaterialScoreModel;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Services\QuizService;

class QuizController extends Controller
{
    protected QuizService $quizService;

    public function __construct(QuizService $quizService)
    {
        $this->quizService = $quizService;
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $userId = $user->id;

        
        $classIds = $user->classes()->pluck('classes.id');
        
        $attemptTable = (new QuizAttemptModel())->getTable();

        $latestAttemptSub = QuizAttemptModel::query()
            ->where('user_id', $userId)
            ->select('quizzes_id', DB::raw('MAX(created_at) as max_created_at'))
            ->groupBy('quizzes_id');

        $latestAttempts = QuizAttemptModel::query()
            ->joinSub($latestAttemptSub, 'latest', function ($join) use ($attemptTable) {
                $join->on("$attemptTable.quizzes_id", '=', 'latest.quizzes_id')
                    ->on("$attemptTable.created_at", '=', 'latest.max_created_at');
            })
            ->where("$attemptTable.user_id", $userId)
            ->get([
                "$attemptTable.id",
                "$attemptTable.quizzes_id",
                "$attemptTable.finished_at",
                "$attemptTable.total_score",
            ])
            ->keyBy('quizzes_id');

        $materialsByQuiz = DB::table('quiz_materials')
            ->join('materials', 'materials.id', '=', 'quiz_materials.material_id')
            ->select('quiz_materials.quizzes_id', 'materials.material_name')
            ->whereIn('quiz_materials.quizzes_id', function ($q) use ($classIds) {
                $q->select('id')->from('quizzes')->whereIn('class_id', $classIds);
            })
            ->orderBy('materials.order_number')
            ->get()
            ->groupBy('quizzes_id')
            ->map(function ($rows) {
                return $rows->pluck('material_name')->values()->all();
            });
        
        $questionCountByQuiz = DB::table('quiz_map')
            ->select('quiz_id', DB::raw('COUNT(*) as total'))
            ->groupBy('quiz_id')
            ->pluck('total', 'quiz_id');
        
        $quizzes = QuizModel::query()
            ->with(['creator:id,nama'])
            ->whereIn('class_id', $classIds)
            ->orderByDesc('id')
            ->get(['id', 'title', 'duration', 'passing_score', 'start_at', 'end_at', 'class_id', 'created_by']);

        $payload = $quizzes->map(function ($q) use ($latestAttempts, $materialsByQuiz, $questionCountByQuiz) {
            $attempt = $latestAttempts->get($q->id);

            $isDone = $attempt && !is_null($attempt->finished_at);

            
            $now = now();
            $availableByTime = true;
            if ($q->start_at && $now->lt($q->start_at)) $availableByTime = false;
            if ($q->end_at && $now->gt($q->end_at)) $availableByTime = false;

            return [
                'id' => $q->id,
                'title' => $q->title,
                'description' => null, 
                'teacher_name' => $q->creator?->nama ?? 'Dosen',
                'duration' => (int) $q->duration,
                'start_at' => $q->start_at,
                'end_at' => $q->end_at,
                'passing_score' => (int) $q->passing_score,
                'total_questions' => (int) ($questionCountByQuiz[$q->id] ?? 0),
                'material_names' => $materialsByQuiz[$q->id] ?? [],
                'status' => $isDone ? 'done' : 'not_done',
                'score' => $isDone ? (int) $attempt->total_score : null,
                'can_review' => $isDone,
                'attempt_id' => $isDone ? (int) $attempt->id : null,
                'is_available' => $availableByTime,
            ];
        })->values();

        return Inertia::render('Mahasiswa/Quizzes/Index', [
            'quizzes' => $payload,
        ]);
    }

    public function show(Request $request, QuizModel $quiz)
    {
        $quiz->load(['creator:id,nama'])
            ->loadCount('questions');

        $attempt = QuizAttemptModel::query()
            ->where('user_id', $request->user()->id)
            ->where('quizzes_id', $quiz->id)
            ->latest('id')
            ->first();

        return Inertia::render('Mahasiswa/Quizzes/Show', [
            'quiz' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'description' => $quiz->description ?? null,
                'teacher_name' => $quiz->creator?->nama ?? 'Dosen',
                'duration' => $quiz->duration,
                'end_at' => $quiz->end_at,
                'total_questions' => $quiz->questions_count ?? 0,
                'status' => ($attempt && $attempt->finished_at) ? 'done' : 'not_done',
                'score' => ($attempt && $attempt->finished_at) ? $attempt->total_score : null,
            ]
        ]);
    }


    public function questions(Request $request, QuizModel $quiz)
    {
        $quiz->load(['questions.options']);

        $questions = $quiz->questions->map(function ($q) {
            return [
                'id' => $q->id,
                'material_id' => $q->material_id,
                'quiz_text' => $q->quiz_text,
                'image_path' => $q->image_path,
                'feedback_correct' => $q->feedback_correct,
                'feedback_incorrect' => $q->feedback_incorrect,
                'points' => (int)($q->pivot?->points ?? 1),
                'options' => $q->options->map(fn($opt) => [
                    'id' => $opt->id,
                    'option_text' => $opt->option_text,
                ]),
            ];
        });

        return response()->json([
            'quiz' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'duration' => $quiz->duration,
                'passing_score' => $quiz->passing_score,
                'start_at' => $quiz->start_at,
                'end_at' => $quiz->end_at,
                'class_id' => $quiz->class_id,
            ],
            'questions' => $questions,
        ]);
    }

    public function startAttempt(Request $request, QuizModel $quiz)
    {
        $userId = auth()->id();

        try {
            $attempt = $this->quizService->validateAndCreateAttempt($userId, $quiz->id, [
                'duration_seconds' => 18 * 60,
                'question_count' => 10,
                'title' => $quiz->title ?? null,
            ]);
        } catch (\Exception $e) {
            return back()->withErrors([
                'quiz' => $e->getMessage(), // ini yang masuk ke props.errors.quiz
            ]);
        }

        return redirect()->route('quiz_attempts.show', $attempt->id);
    }


    public function attemptShow(Request $request, QuizAttemptModel $attempt)
    {
        if ($attempt->user_id !== $request->user()->id) {
            abort(403);
        }

        $quiz = QuizModel::with(['questions.options'])->findOrFail($attempt->quizzes_id);

        $cfg = session("quiz_cfg_{$attempt->id}", [
            'duration_seconds' => (int)$quiz->duration * 60,
        ]);

        
        $savedAnswers = UserQuizAnswerModel::query()
            ->where('quiz_attempts_id', $attempt->id)
            ->get()
            ->keyBy('quiz_questions_id');

        
        $questions = $quiz->questions->map(function ($q) {
            return [
                'id' => $q->id,
                'material_id' => $q->material_id,
                'quiz_text' => $q->quiz_text,
                'image_path' => $q->image_path,
                'feedback_correct' => $q->feedback_correct,
                'feedback_incorrect' => $q->feedback_incorrect,
                'points' => (int)($q->pivot?->points ?? 1),
                'options' => $q->options->map(fn($o) => [
                    'id' => $o->id,
                    'option_text' => $o->option_text,
                ]),
            ];
        })->values();

        $attempt->load(['quiz', 'quiz.creator', 'quiz.questions']);

        return Inertia::render('Mahasiswa/Quizzes/Attempt', [
            'attempt' => [
                'id' => $attempt->id,
                'started_at' => $attempt->started_at,
                'finished_at' => $attempt->finished_at,
                'total_score' => $attempt->total_score,
                'quiz' => [
                    'id' => $quiz->id,
                    'title' => $quiz->title,
                    'duration' => $quiz->duration,
                    'passing_score' => $quiz->passing_score,
                ],
            ],
            'cfg' => $cfg,
            'questions' => $questions,
            'savedAnswers' => $savedAnswers,
        ]);
    }

    public function checkAnswer(Request $request, QuizAttemptModel $attempt)
    {
        abort_unless($attempt->user_id === $request->user()->id, 403);

        $data = $request->validate([
            'question_id' => ['required', 'integer'],
            'option_id'   => ['required', 'integer'],
        ]);

        $question = QuizQuestionsModel::with('options')
            ->where('id', $data['question_id'])
            ->firstOrFail();

        $correctOpt = $question->options->firstWhere('is_correct', 1);
        $isCorrect  = $correctOpt && (int)$correctOpt->id === (int)$data['option_id'];

        return response()->json([
            'is_correct' => $isCorrect,
            'feedback'   => $isCorrect
                ? $question->feedback_correct
                : $question->feedback_incorrect,
        ]);
    }

    public function submitAnswers(Request $request, QuizAttemptModel $attempt)
    {
        abort_unless($attempt->user_id === $request->user()->id, 403);

        if ($attempt->finished_at) {
            return redirect()->route('quiz_attempts.completed', $attempt->id);
        }

        $data = $request->validate([
            'answers' => ['required','array'],
            'answers.*.option_id' => ['nullable','integer'],
            'answers.*.timespent' => ['nullable','integer','min:0'],
            'auto_submit' => ['nullable','in:0,1'],
        ]);

        $answersPayload = $data['answers'];
        $questionIds = array_map('intval', array_keys($answersPayload));

        $questions = QuizQuestionsModel::query()
            ->join('quiz_map', 'quiz_map.quiz_question_id', '=', 'quiz_questions.id')
            ->where('quiz_map.quiz_id', $attempt->quizzes_id)
            ->whereIn('quiz_questions.id', $questionIds)
            ->select('quiz_questions.*', 'quiz_map.points')
            ->with('options')
            ->get()
            ->keyBy('id');

        $allQuizQuestions = QuizQuestionsModel::query()
            ->join('quiz_map', 'quiz_map.quiz_question_id', '=', 'quiz_questions.id')
            ->where('quiz_map.quiz_id', $attempt->quizzes_id)
            ->select('quiz_questions.*', 'quiz_map.points')
            ->with('options')
            ->get()
            ->keyBy('id');

        DB::transaction(function () use ($attempt, $answersPayload, $questions, $allQuizQuestions) {
            $totalScore = 0;

            // Simpan jawaban user
            foreach ($answersPayload as $qid => $a) {
                $qid = (int)$qid;
                $q = $questions->get($qid);
                if (!$q) continue;

                $selectedOptId = isset($a['option_id']) ? (int)$a['option_id'] : null;
                $correctOpt = $q->options->firstWhere('is_correct', 1);

                $isCorrect = $correctOpt && $selectedOptId && ((int)$correctOpt->id === $selectedOptId);
                if ($isCorrect) {
                    $totalScore += (int)($q->points ?? 1);
                }

                UserQuizAnswerModel::updateOrCreate(
                    [
                        'quiz_attempts_id' => $attempt->id,
                        'quiz_questions_id' => $q->id,
                    ],
                    [
                        'quiz_options_id' => $selectedOptId,
                        'is_correct' => $isCorrect ? 1 : 0,
                    ]
                );
            }

            $attempt->update([
                'finished_at' => now(),
                'total_score' => $totalScore,
            ]);
            $materialStats = []; 

            foreach ($allQuizQuestions as $q) {
                $points = (int)($q->points ?? 1);
                $materialId = (int)$q->material_id;

                if (!isset($materialStats[$materialId])) {
                    $materialStats[$materialId] = ['earned' => 0, 'max' => 0, 'correct' => 0];
                }
                $materialStats[$materialId]['max'] += $points;

                $answer = $answersPayload[$q->id] ?? null;
                if ($answer) {
                    $selectedOptId = isset($answer['option_id']) ? (int)$answer['option_id'] : null;
                    $correctOpt = $q->options->firstWhere('is_correct', 1);
                    $isCorrect = $correctOpt && $selectedOptId && ((int)$correctOpt->id === $selectedOptId);

                    if ($isCorrect) {
                        $materialStats[$materialId]['earned'] += $points;
                        $materialStats[$materialId]['correct']++;
                    }
                }
            }

            foreach ($materialStats as $materialId => $stat) {
                $pct = $stat['max'] > 0 ? (int)round(($stat['earned'] / $stat['max']) * 100) : 0;

                QuizAttemptMaterialScoreModel::updateOrCreate(
                    [
                        'quiz_attempts_id' => $attempt->id,
                        'material_id'      => $materialId,
                    ],
                    [
                        'correct_count' => $stat['correct'],
                        'earned_score'  => $stat['earned'],
                        'max_score'     => $stat['max'],
                        'percentage'    => $pct,
                    ]
                );
            }
        });

        return redirect()->route('quiz_attempts.completed', $attempt->id);
    }

    public function completed(Request $request, QuizAttemptModel $attempt)
    {
        abort_unless($attempt->user_id === $request->user()->id, 403);
        abort_unless(!is_null($attempt->finished_at), 404); 

        $attempt->load('quiz'); 
        $rows = DB::table('quiz_attempt_material_scores')
            ->join('materials', 'materials.id', '=', 'quiz_attempt_material_scores.material_id')
            ->where('quiz_attempt_material_scores.quiz_attempts_id', $attempt->id)
            ->select(
                'quiz_attempt_material_scores.material_id',
                'materials.material_name',
                'quiz_attempt_material_scores.percentage',
                'quiz_attempt_material_scores.earned_score',
                'quiz_attempt_material_scores.max_score'
            )
            ->orderBy('quiz_attempt_material_scores.percentage', 'asc') 
            ->get();

        $recommendations = $rows
            ->filter(fn($r) => (int)$r->percentage < 70)
            ->take(3)
            ->values()
            ->map(function ($r) {
                return [
                    'material_id' => (int)$r->material_id,
                    'name' => $r->material_name,
                    'percentage' => (int)$r->percentage,
                    'earned_score' => (int)$r->earned_score,
                    'max_score' => (int)$r->max_score,
                ];
            });

        return Inertia::render('Mahasiswa/Quizzes/Completed', [
            'attempt' => [
                'id' => $attempt->id,
                'quiz_id' => $attempt->quizzes_id,
                'title' => $attempt->quiz?->title,
                'total_score' => (int)$attempt->total_score,
                'finished_at' => $attempt->finished_at,
            ],
            'materialScores' => $rows->map(fn($r) => [
                'material_id' => (int)$r->material_id,
                'name' => $r->material_name,
                'percentage' => (int)$r->percentage,
                'earned_score' => (int)$r->earned_score,
                'max_score' => (int)$r->max_score,
            ])->values(),
            'recommendations' => $recommendations,
        ]);
    }

    public function review(Request $request, $attempt)
    {
        $attempt = QuizAttemptModel::with([
            'quiz.materials:id,material_name',
            'quiz.questions.options',
            'answers',
        ])->findOrFail($attempt);

        if ($attempt->user_id !== $request->user()->id) {
            abort(403);
        }

        $answersByQuestion = $attempt->answers->keyBy('quiz_questions_id');

        // Rekomendasi materi
        $materialRows = DB::table('quiz_attempt_material_scores')
            ->join('materials', 'materials.id', '=', 'quiz_attempt_material_scores.material_id')
            ->where('quiz_attempt_material_scores.quiz_attempts_id', $attempt->id)
            ->select(
                'quiz_attempt_material_scores.material_id',
                'materials.material_name',
                'quiz_attempt_material_scores.percentage',
                'quiz_attempt_material_scores.earned_score',
                'quiz_attempt_material_scores.max_score'
            )
            ->orderBy('quiz_attempt_material_scores.percentage', 'asc')
            ->get();

        $recommendations = $materialRows
            ->filter(fn($r) => (int)$r->percentage < 70)
            ->take(3)
            ->values()
            ->map(fn($r) => [
                'material_id' => (int)$r->material_id,
                'name' => $r->material_name,
                'percentage' => (int)$r->percentage,
                'earned_score' => (int)$r->earned_score,
                'max_score' => (int)$r->max_score,
            ]);

        return Inertia::render('Mahasiswa/Quizzes/Review', [
            'attempt' => [
                'id' => $attempt->id,
                'total_score' => $attempt->total_score,
                'finished_at' => $attempt->finished_at,
            ],
            'quiz' => [
                'id' => $attempt->quiz->id,
                'title' => $attempt->quiz->title,
                'materials' => $attempt->quiz->materials->pluck('material_name'),
            ],
            'recommendations' => $recommendations,
            'questions' => $attempt->quiz->questions->map(function ($q) use ($answersByQuestion) {
                $ans = $answersByQuestion->get($q->id);
                return [
                    'id' => $q->id,
                    'quiz_text' => $q->quiz_text,
                    'feedback_correct' => $q->feedback_correct,
                    'feedback_incorrect' => $q->feedback_incorrect,
                    'options' => $q->options->map(fn($o) => [
                        'id' => $o->id,
                        'text' => $o->option_text,
                    ]),
                    'selected_option_id' => $ans?->quiz_options_id ?? null,
                    'is_correct' => $ans ? (bool) $ans->is_correct : false,
                    'answered' => !is_null($ans),
                ];
            }),
        ]);
    }

    private function updateCompletedQuizAt(int $userId, int $quizId): void
    {
        $classId = DB::table('class_user')
            ->where('user_id', $userId)
            ->value('class_id');

        if (!$classId) return;

        $materialIds = QuizMapModel::query()
            ->join('quiz_questions', 'quiz_questions.id', '=', 'quiz_map.quiz_question_id')
            ->where('quiz_map.quiz_id', $quizId)
            ->pluck('quiz_questions.material_id')
            ->unique();

        if ($materialIds->isEmpty()) return;

        UserProgressModel::query()
            ->where('user_id', $userId)
            ->where('class_id', $classId)
            ->whereIn('material_id', $materialIds)
            ->update(['completed_quiz_at' => now()]);
    }
}
