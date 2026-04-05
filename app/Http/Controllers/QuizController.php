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
use App\Models\MaterialRecommendationModel;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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

        // Semua kuis yang bisa diakses user: class_id harus salah satu kelas user
        $accessibleQuizIds = QuizModel::query()
            ->whereIn('class_id', $classIds)
            ->pluck('id');

        if ($accessibleQuizIds->isEmpty()) {
            return Inertia::render('Mahasiswa/Quizzes/Index', [
                'quizzes' => [],
            ]);
        }

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

        // Ambil mapping quiz -> materi (id + nama)
        $materialsRaw = DB::table('quiz_materials')
            ->join('materials', 'materials.id', '=', 'quiz_materials.material_id')
            ->select('quiz_materials.quizzes_id', 'materials.id as material_id', 'materials.material_name')
            ->whereIn('quiz_materials.quizzes_id', $accessibleQuizIds)
            ->orderBy('materials.order_number')
            ->get();

        $materialsByQuiz = $materialsRaw
            ->groupBy('quizzes_id')
            ->map(function ($rows) {
                return $rows->pluck('material_name')->values()->all();
            });

        // Progress membaca + latihan per materi untuk user ini
        $materialIds = $materialsRaw->pluck('material_id')->unique()->values();

        $progressByClassAndMaterial = collect();
        $progressFlagsByMaterial = collect();
        $materialsWithPractice = collect();

        if ($materialIds->isNotEmpty()) {
            $progressRows = DB::table('user_progress')
                ->where('user_id', $userId)
                ->whereIn('material_id', $materialIds)
                ->select('class_id', 'material_id', 'read_at', 'completed_practice_at')
                ->get();

            $progressByClassAndMaterial = $progressRows
                ->groupBy('class_id')
                ->map(function ($rows) {
                    return $rows->keyBy('material_id');
                });

            // Fallback flags lintas class_id untuk antisipasi data progress tersimpan di row class berbeda/null
            $progressFlagsByMaterial = $progressRows
                ->groupBy('material_id')
                ->map(function ($rows) {
                    return [
                        'has_read' => $rows->contains(fn($r) => !is_null($r->read_at)),
                        'ready_for_quiz' => $rows->contains(fn($r) => !is_null($r->read_at) && !is_null($r->completed_practice_at)),
                    ];
                });

            $materialsWithPractice = DB::table('practices')
                ->whereIn('material_id', $materialIds)
                ->select('material_id')
                ->distinct()
                ->pluck('material_id')
                ->flip();
        }
        
        $questionCountByQuiz = DB::table('quiz_map')
            ->select('quiz_id', DB::raw('COUNT(*) as total'))
            ->groupBy('quiz_id')
            ->pluck('total', 'quiz_id');
        
        $quizzes = QuizModel::query()
            ->with(['creator:id,nama'])
            ->whereIn('id', $accessibleQuizIds)
            ->orderByDesc('id')
            ->get(['id', 'title', 'duration', 'passing_score', 'start_at', 'end_at', 'class_id', 'created_by']);

        $payload = $quizzes->map(function ($q) use ($latestAttempts, $materialsByQuiz, $questionCountByQuiz, $materialsRaw, $progressByClassAndMaterial, $progressFlagsByMaterial, $materialsWithPractice) {
            $attempt = $latestAttempts->get($q->id);

            $isDone = $attempt && !is_null($attempt->finished_at);

            
            $now = now();
            $availableByTime = true;
            if ($q->start_at && $now->lt($q->start_at)) $availableByTime = false;
            if ($q->end_at && $now->gt($q->end_at)) $availableByTime = false;

            // Cek apakah semua materi yang diuji sudah dibaca & latihan selesai
            $requirements = $materialsRaw->where('quizzes_id', $q->id);

            $progressOk = true;
            if ($requirements->isNotEmpty()) {
                // Progress diambil berdasarkan class_id kuis (karena kuis hanya untuk satu kelas)
                $classProgress = $progressByClassAndMaterial->get($q->class_id, collect());
                foreach ($requirements as $row) {
                    $materialId = $row->material_id;
                    $p = $classProgress->get($materialId);

                    $fallbackFlags = $progressFlagsByMaterial->get($materialId, [
                        'has_read' => false,
                        'ready_for_quiz' => false,
                    ]);

                    $hasRead = ($p && !is_null($p->read_at)) || (bool)($fallbackFlags['has_read'] ?? false);
                    $hasPractice = $materialsWithPractice->has($materialId);
                    $readyFromClassProgress = $p && !is_null($p->read_at) && !is_null($p->completed_practice_at);
                    $readyFromFallback = (bool)($fallbackFlags['ready_for_quiz'] ?? false);

                    // Untuk materi yang punya latihan, wajib read_at + completed_practice_at sama-sama terisi.
                    // Untuk materi tanpa latihan, cukup read_at.
                    $progressSatisfied = $hasPractice
                        ? ($readyFromClassProgress || $readyFromFallback)
                        : $hasRead;

                    if (!$progressSatisfied) {
                        $progressOk = false;
                        break;
                    }
                }
            }

            // is_available dipakai UI untuk status Terkunci karena progress.
            // Batas waktu ditangani terpisah di frontend lewat start_at/end_at.
            $isAvailable = $progressOk;

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
                'is_available' => $isAvailable,
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

        // Fetch materials for this quiz from quiz_material
        $materials = DB::table('quiz_materials')
            ->join('materials', 'materials.id', '=', 'quiz_materials.material_id')
            ->where('quiz_materials.quizzes_id', $quiz->id)
            ->orderBy('materials.order_number')
            ->select('materials.id', 'materials.material_name')
            ->get();

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
                'materials' => $materials,
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
        $userId = Auth::id();

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

        // Tandai completed_quiz_at untuk semua materi yang tercantum di kuis ini.
        $this->updateCompletedQuizAt((int)$request->user()->id, (int)$attempt->quizzes_id);

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

        // Simpan semua materi quiz ke tabel material_recommendations.
        // Yang lulus tetap masuk dengan is_completed = true.
        foreach ($rows as $row) {
            $isCompleted = ((int)$row->percentage >= 70);

            MaterialRecommendationModel::updateOrCreate(
                [
                    'user_id' => $request->user()->id,
                    'material_id' => (int)$row->material_id,
                    'quizzes_id' => $attempt->quizzes_id,
                ],
                [
                    'reason' => $isCompleted ? 'high_score' : 'low_score',
                    'is_completed' => $isCompleted,
                ]
            );
        }

        $savedRecommendations = MaterialRecommendationModel::query()
            ->join('materials', 'materials.id', '=', 'material_recommendations.material_id')
            ->where('material_recommendations.user_id', $request->user()->id)
            ->where('material_recommendations.quizzes_id', $attempt->quizzes_id)
            ->where('material_recommendations.is_completed', false)
            ->select(
                'material_recommendations.material_id',
                'materials.material_name as name',
                DB::raw('0 as percentage'),
                DB::raw('0 as earned_score'),
                DB::raw('0 as max_score')
            )
            ->orderByDesc('material_recommendations.id')
            ->get()
            ->map(fn($r) => [
                'material_id' => (int)$r->material_id,
                'name' => $r->name,
                'percentage' => (int)$r->percentage,
                'earned_score' => (int)$r->earned_score,
                'max_score' => (int)$r->max_score,
            ]);

        if ($savedRecommendations->isNotEmpty()) {
            $recommendations = $savedRecommendations;
        }

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

        $savedRecommendations = MaterialRecommendationModel::query()
            ->join('materials', 'materials.id', '=', 'material_recommendations.material_id')
            ->where('material_recommendations.user_id', $request->user()->id)
            ->where('material_recommendations.quizzes_id', $attempt->quizzes_id)
            ->where('material_recommendations.is_completed', false)
            ->select(
                'material_recommendations.material_id',
                'materials.material_name as name',
                DB::raw('0 as percentage'),
                DB::raw('0 as earned_score'),
                DB::raw('0 as max_score')
            )
            ->orderByDesc('material_recommendations.id')
            ->get()
            ->map(fn($r) => [
                'material_id' => (int)$r->material_id,
                'name' => $r->name,
                'percentage' => (int)$r->percentage,
                'earned_score' => (int)$r->earned_score,
                'max_score' => (int)$r->max_score,
            ]);

        if ($savedRecommendations->isNotEmpty()) {
            $recommendations = $savedRecommendations;
        }

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

    public function dosenIndexPage()
    {
        $user = Auth::user();

        if ($user && $user->role === 'superadmin') {
            $quizzes = $this->quizService->getQuizzesForAdmin();

            $classes = \App\Models\ClassModel::query()
                ->orderBy('class_name')
                ->get(['id', 'class_name']);
        } else {
            $userId = $user?->id;

            $quizzes = $this->quizService->getQuizzesForLecturer($userId);

            $classes = \App\Models\ClassModel::query()
                ->where('created_by', $userId)
                ->orderBy('class_name')
                ->get(['id', 'class_name']);
        }

        return Inertia::render('ManageQuizzes/Index', [
            'quizzes' => $quizzes,
            'classes' => $classes,
            'authUser' => $user,
        ]);
    }

    public function dosenShowPage(QuizModel $quiz)
    {
        $user = Auth::user();

        $canManage = (int) $quiz->created_by === (int) $user->id
            || $user->role === 'superadmin';

        abort_unless($canManage, 403);

        $quiz->load(['questions.options', 'class']);

        $materials = $quiz->materials()
            ->orderBy('material_name')
            ->get(['materials.id', 'materials.material_name']);

        $questions = $quiz->questions->map(function ($q) use ($materials) {
            $matName = 'Tidak ada materi';
            if ($q->material_id) {
                $mat = $materials->firstWhere('id', $q->material_id);
                $matName = $mat ? $mat->material_name : 'Materi Dihapus';
            }

            return [
                'id' => $q->id,
                'material_id' => $q->material_id,
                'material_name' => $matName,
                'quiz_text' => $q->quiz_text,
                'image_path' => $q->image_path,
                'image_url' => $q->image_path ? asset('storage/' . $q->image_path) : null,
                'feedback_correct' => $q->feedback_correct,
                'feedback_incorrect' => $q->feedback_incorrect,
                'points' => (int) ($q->pivot->points ?? 1),
                'options' => $q->options->map(function ($opt) {
                    return [
                        'id' => $opt->id,
                        'option_text' => $opt->option_text,
                        'is_correct' => (bool) $opt->is_correct,
                    ];
                }),
            ];
        });

        return Inertia::render('ManageQuizzes/Show', [
            'quiz' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'description' => $quiz->description ?? null,
                'class_name' => $quiz->class?->class_name ?? 'Unknown Class',
                'duration' => $quiz->duration,
                'passing_score' => $quiz->passing_score,
                'start_at' => $quiz->start_at,
                'end_at' => $quiz->end_at,
                'materials' => $materials,
            ],
            'questions' => $questions,
            'authUser' => $user,
        ]);
    }

    public function dosenCreatePage()
    {
        $user = Auth::user();

        if ($user && $user->role === 'superadmin') {
            $classes = \App\Models\ClassModel::query()
                ->orderBy('class_name')
                ->get(['id', 'class_name']);

            $materials = \App\Models\MaterialModel::query()
                ->orderBy('material_name')
                ->get(['id', 'material_name']);
        } else {
            $classes = \App\Models\ClassModel::query()
                ->where('created_by', $user->id)
                ->orderBy('class_name')
                ->get(['id', 'class_name']);

            $materials = \App\Models\MaterialModel::query()
                ->where('created_by', $user->id)
                ->orderBy('material_name')
                ->get(['id', 'material_name']);
        }

        return Inertia::render('ManageQuizzes/Create', [
            'classes' => $classes,
            'materials' => $materials,
            'authUser' => $user,
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'class_ids' => ['required', 'array', 'min:1'],
            'class_ids.*' => ['integer', 'exists:classes,id'],
            'title' => ['required', 'string', 'max:255'],
            'duration' => ['required', 'integer', 'min:1'],
            'passing_score' => ['required', 'integer', 'min:0', 'max:100'],
            'start_at' => ['nullable', 'date'],
            'end_at' => ['nullable', 'date'],
            'material_ids' => ['required', 'array', 'min:1'],
            'material_ids.*' => ['exists:materials,id'],
        ]);

        $createdQuizzes = [];

        foreach ($validated['class_ids'] as $classId) {
            $quiz = QuizModel::create([
                'class_id' => $classId,
                'title' => $validated['title'],
                'duration' => $validated['duration'],
                'passing_score' => $validated['passing_score'],
                'start_at' => $validated['start_at'],
                'end_at' => $validated['end_at'],
                'created_by' => $user->id,
            ]);

            // Hubungkan kuis dengan materi yang dipilih
            $quiz->materials()->sync($validated['material_ids']);

            $createdQuizzes[] = $quiz;
        }

        $firstQuiz = $createdQuizzes[0] ?? null;

        if ($firstQuiz) {
            return redirect()->route('dosen.quizzes.show', $firstQuiz->id)
                ->with('success', 'Kuis berhasil dibuat untuk ' . count($createdQuizzes) . ' kelas. Silakan kelola pertanyaan melalui halaman ini.');
        }

        return redirect()->route('dosen.quizzes.index')
            ->with('success', 'Kuis berhasil dibuat.');
    }

    public function dosenEditPage(QuizModel $quiz)
    {
        $user = Auth::user();

        $canManage = (int) $quiz->created_by === (int) $user->id
            || $user->role === 'superadmin';

        abort_unless($canManage, 403);

        $quiz->load(['questions.options', 'class']);

        if ($user && $user->role === 'superadmin') {
            $classes = \App\Models\ClassModel::query()
                ->orderBy('class_name')
                ->get(['id', 'class_name']);
        } else {
            $classes = \App\Models\ClassModel::query()
                ->where('created_by', $user->id)
                ->orderBy('class_name')
                ->get(['id', 'class_name']);
        }

        $questions = $quiz->questions->map(function ($q) {
            return [
                'id' => $q->id,
                'material_id' => $q->material_id,
                'quiz_text' => $q->quiz_text,
                'image_path' => $q->image_path,
                'feedback_correct' => $q->feedback_correct,
                'feedback_incorrect' => $q->feedback_incorrect,
                'points' => (int) ($q->pivot->points ?? 1),
                'options' => $q->options->map(function ($opt) {
                    return [
                        'id' => $opt->id,
                        'option_text' => $opt->option_text,
                        'is_correct' => (bool) $opt->is_correct,
                    ];
                }),
            ];
        });

        $materials = $quiz->materials()
            ->orderBy('material_name')
            ->get(['materials.id', 'materials.material_name']);

        return Inertia::render('ManageQuizzes/Edit', [
            'materials' => $materials,
            'classes' => $classes,
            'quiz' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'description' => $quiz->description ?? null,
                'class_id' => $quiz->class_id,
                'class_name' => $quiz->class?->class_name ?? 'Unknown Class',
                'duration' => $quiz->duration,
                'passing_score' => $quiz->passing_score,
                'start_at' => $quiz->start_at ? \Carbon\Carbon::parse($quiz->start_at)->format('Y-m-d\TH:i') : "",
                'end_at' => $quiz->end_at ? \Carbon\Carbon::parse($quiz->end_at)->format('Y-m-d\TH:i') : "",
            ],
            'questions' => $questions,
            'authUser' => $user,
        ]);
    }

    public function dosenSaveQuestions(Request $request, QuizModel $quiz)
    {
        $user = Auth::user();
        $canManage = (int) $quiz->created_by === (int) $user->id
            || $user->role === 'superadmin';

        abort_unless($canManage, 403);

        $validated = $request->validate([
            'class_id' => ['required', 'integer', 'exists:classes,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'duration' => ['required', 'integer', 'min:1'],
            'passing_score' => ['required', 'integer', 'min:0', 'max:100'],
            'start_at' => ['nullable', 'date'],
            'end_at' => ['nullable', 'date'],
            
            'questions' => ['nullable', 'array'],
            'questions.*.id' => ['nullable', 'integer'],
            'questions.*.material_id' => ['nullable', 'integer'],
            'questions.*.quiz_text' => ['required', 'string'],
            'questions.*.points' => ['nullable', 'integer', 'min:1', 'max:100'],
            'questions.*.feedback_correct' => ['nullable', 'string'],
            'questions.*.feedback_incorrect' => ['nullable', 'string'],
            'questions.*.image' => ['nullable', 'image', 'max:2048'],
            'questions.*.options' => ['required', 'array', 'min:2'],
            'questions.*.options.*.text' => ['required', 'string'],
            'questions.*.options.*.is_correct' => ['required', 'boolean'],
        ]);

        DB::transaction(function () use ($quiz, $validated, $request) {
            $quiz->update([
            'class_id' => $validated['class_id'],
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'duration' => $validated['duration'],
                'passing_score' => $validated['passing_score'],
                'start_at' => $validated['start_at'] ?? null,
                'end_at' => $validated['end_at'] ?? null,
            ]);

            $questionsInput = $validated['questions'] ?? [];
            
            $existingMap = QuizMapModel::where('quiz_id', $quiz->id)->get()->keyBy('quiz_question_id');
            $keptQuestionIds = [];

            foreach ($questionsInput as $index => $qData) {
                $qid = isset($qData['id']) ? (int) $qData['id'] : null;
                
                if ($qid && $existingMap->has($qid)) {
                    $question = \App\Models\QuizQuestionsModel::find($qid);
                    $question->material_id = $qData['material_id'] ?? $question->material_id;
                } else {
                    $question = new \App\Models\QuizQuestionsModel();
                    $question->material_id = $qData['material_id'] ?? null;
                }

                $question->quiz_text = $qData['quiz_text'];

                $feedbackCorrect = $qData['feedback_correct'] ?? 'Jawaban kamu benar.';
                $feedbackIncorrect = $qData['feedback_incorrect'] ?? 'Jawaban kamu salah.';
                
                $question->feedback_correct = $feedbackCorrect;
                $question->feedback_incorrect = $feedbackIncorrect;

                // handle image upload
                $imageKey = "questions.$index.image";
                if ($request->hasFile($imageKey)) {
                    if ($question->image_path) {
                        \Illuminate\Support\Facades\Storage::disk('public')->delete($question->image_path);
                    }
                    $path = $request->file($imageKey)->store('quizzes', 'public');
                    $question->image_path = $path;
                }

                $question->save();
                
                $keptQuestionIds[] = $question->id;

                // Update mapped points
                \App\Models\QuizMapModel::updateOrCreate(
                    [
                        'quiz_id' => $quiz->id,
                        'quiz_question_id' => $question->id
                    ],
                    [
                        'points' => $qData['points'] ?? 10
                    ]
                );

                // Re-create options
                $question->options()->delete();
                foreach ($qData['options'] as $optData) {
                    \App\Models\QuizOptionModel::create([
                        'quiz_questions_id' => $question->id,
                        'option_text' => $optData['text'],
                        'is_correct' => $optData['is_correct'] ? 1 : 0,
                    ]);
                }
            }

            // Remove unkept mapping
            if (!empty($keptQuestionIds)) {
                $unkept = \App\Models\QuizMapModel::where('quiz_id', $quiz->id)
                    ->whereNotIn('quiz_question_id', $keptQuestionIds)->get();
                foreach($unkept as $u) {
                    $u->delete();
                }
            } else {
                \App\Models\QuizMapModel::where('quiz_id', $quiz->id)->delete();
            }
        });

        // Kembali ke halaman edit agar StatusModal di frontend bisa tampil,
        // lalu dari modal user bisa memilih untuk kembali ke detail kuis.
        $routeName = $user->role === 'superadmin'
            ? 'superadmin.quizzes.edit'
            : 'dosen.quizzes.edit';

        return redirect()->route($routeName, $quiz->id)
            ->with('success', 'Kuis dan soal berhasil disimpan.');
    }

    public function update(Request $request, QuizModel $quiz)
    {
        $user = $request->user();
        $canManage = (int) $quiz->created_by === (int) $user->id
            || $user->role === 'superadmin';

        abort_unless($canManage, 403);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'duration' => ['required', 'integer', 'min:1'],
            'passing_score' => ['required', 'integer', 'min:0', 'max:100'],
            'start_at' => ['nullable', 'date'],
            'end_at' => ['nullable', 'date'],
        ]);

        $quiz->update($data);

        $routeName = $user->role === 'superadmin'
            ? 'superadmin.quizzes.show'
            : 'dosen.quizzes.show';

        return redirect()->route($routeName, $quiz->id)->with('success', 'Quiz updated successfully');
    }

    public function duplicateToClasses(Request $request, QuizModel $quiz)
    {
        $user = $request->user();

        $canManage = (int) $quiz->created_by === (int) $user->id
            || $user->role === 'superadmin';

        abort_unless($canManage, 403);

        $data = $request->validate([
            'class_ids' => ['required', 'array', 'min:1'],
            'class_ids.*' => ['integer', 'exists:classes,id'],
        ]);

        $classIds = collect($data['class_ids'])
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->reject(fn ($id) => $id === (int) $quiz->class_id)
            ->values();

        if ($classIds->isEmpty()) {
            return back()->with('success', 'Tidak ada kelas baru yang dipilih untuk duplikasi.');
        }

        $quiz->load(['materials', 'questions.options']);

        DB::transaction(function () use ($quiz, $classIds, $user) {
            $materialIds = $quiz->materials->pluck('id')->all();
            $questions = $quiz->questions;

            foreach ($classIds as $classId) {
                // Untuk dosen, pastikan hanya boleh ke kelas yang dia buat
                if ($user->role !== 'superadmin') {
                    $ownsClass = \App\Models\ClassModel::where('id', $classId)
                        ->where('created_by', $user->id)
                        ->exists();

                    if (! $ownsClass) {
                        continue;
                    }
                }

                $newQuiz = QuizModel::create([
                    'class_id' => $classId,
                    'title' => $quiz->title,
                    'description' => $quiz->description,
                    'duration' => $quiz->duration,
                    'passing_score' => $quiz->passing_score,
                    'start_at' => $quiz->start_at,
                    'end_at' => $quiz->end_at,
                    'created_by' => $user->id,
                ]);

                if (! empty($materialIds)) {
                    $newQuiz->materials()->sync($materialIds);
                }

                foreach ($questions as $question) {
                    $newQuestion = $question->replicate();
                    $newQuestion->push();

                    QuizMapModel::create([
                        'quiz_id' => $newQuiz->id,
                        'quiz_question_id' => $newQuestion->id,
                        'points' => (int) ($question->pivot->points ?? 10),
                    ]);

                    foreach ($question->options as $opt) {
                        QuizOptionModel::create([
                            'quiz_questions_id' => $newQuestion->id,
                            'option_text' => $opt->option_text,
                            'is_correct' => (int) $opt->is_correct,
                        ]);
                    }
                }
            }
        });

        return back()->with('success', 'Kuis berhasil diduplikasi ke kelas yang dipilih.');
    }
}
