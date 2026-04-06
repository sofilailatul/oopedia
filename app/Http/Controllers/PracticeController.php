<?php

namespace App\Http\Controllers;

use App\Services\PracticeService;
use App\Models\PracticeAttemptModel;
use App\Models\PracticeModel;
use App\Models\PracticeQuestionModel;
use App\Models\PracticeOptionModel;
use App\Models\PracticeItemModel;
use App\Models\SubTopicModel;
use App\Models\UserPracticeAnswerModel;
use App\Models\MaterialModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PracticeController extends Controller
{
    protected $practiceService;

    public function __construct(PracticeService $practiceService)
    {
        $this->practiceService = $practiceService;
    }

    /**
     * Display all practices
     */
    public function index()
    {
        $userId = Auth::id();
        $practices = $this->practiceService->getPracticesForUser($userId);

        return Inertia::render('Practices/Index', [
            'practices' => $practices,
        ]);
    }

    /**
     * Display practices page for lecturers (dosen)
     */
    public function dosenIndexPage()
    {
        $user = Auth::user();
        $userId = $user->id;

        if ($user->role === 'superadmin') {
            $practices = $this->practiceService->getPracticesForAdmin();

            $materials = MaterialModel::query()
                ->orderBy('material_name')
                ->get(['id', 'material_name']);
        } else {
            $practices = $this->practiceService->getPracticesForLecturer($userId);

            $materials = MaterialModel::query()
                ->where('created_by', $userId)
                ->orderBy('material_name')
                ->get(['id', 'material_name']);
        }

        return Inertia::render('ManagePractices/Index', [
            'practices' => $practices,
            'materials' => $materials,
            'authUser' => $user,
        ]);
    }

    /**
     * Store a new practice (per material & difficulty) for lecturer.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        $userId = $user->id;

        $data = $request->validate([
            'material_id' => ['required', 'integer', 'exists:materials,id'],
            'difficulty_level' => ['required', 'in:easy,normal,hard'],
        ]);

        $materialQuery = MaterialModel::query()->where('id', $data['material_id']);

        if ($user->role !== 'superadmin') {
            $materialQuery->where('created_by', $userId);
        }

        $material = $materialQuery->firstOrFail();

        $exists = PracticeModel::query()
            ->where('material_id', $material->id)
            ->where('difficulty_level', $data['difficulty_level'])
            ->exists();

        if ($exists) {
            return back()->withErrors([
                'difficulty_level' => 'Latihan untuk level ini pada materi tersebut sudah ada.',
            ]);
        }

        $practice = PracticeModel::create([
            'material_id' => $material->id,
            'practice_type' => 'practice',
            'level' => $data['difficulty_level'] === 'normal' ? 'medium' : $data['difficulty_level'],
            'difficulty_level' => $data['difficulty_level'],
        ]);

        $routeName = $user->role === 'superadmin'
            ? 'superadmin.practices.create'
            : 'dosen.practices.create';

        return redirect()->route($routeName, $practice->id)
            ->with('success', 'Latihan soal berhasil dibuat.');
    }

    /**
     * Show question create page for a specific practice (dosen).
     */
    public function dosenCreatePage(PracticeModel $practice)
    {
        $user = Auth::user();

        $practice->load(['material:id,material_name,created_by', 'questions.options', 'questions.items']);
        $isOwner = $practice->material && (int) $practice->material->created_by === (int) $user->id;
        abort_unless($isOwner || $user->role === 'superadmin', 403);

        $questions = $practice->questions
            ->sortBy('id')
            ->values()
            ->map(function (PracticeQuestionModel $q) {
                return [
                    'id' => $q->id,
                    'question_text' => $q->question_text,
                    'sub_topic' => $q->sub_topic,
                    'type' => $q->type ?? 'multiple_choice',
                    'points' => (int) ($q->points ?? 10),
                    'output_code' => $q->output_code,
                    'feedback_correct' => $q->feedback_correct,
                    'feedback_incorrect' => $q->feedback_incorrect,
                    'image_url' => $q->image_path ? asset('storage/' . $q->image_path) : null,
                    'options' => (($q->options->count() > 0)
                        ? $q->options->map(function (PracticeOptionModel $opt) {
                            return [
                                'id' => $opt->id,
                                'text' => $opt->option_text,
                                'is_correct' => (bool) $opt->is_correct,
                            ];
                        })
                        : $q->items->map(function (PracticeItemModel $item) {
                            return [
                                'id' => $item->id,
                                'text' => $item->item_text,
                                'is_correct' => false,
                            ];
                        }))->values(),
                ];
            });

        return Inertia::render('ManagePractices/Create', [
            'practice' => [
                'id' => $practice->id,
                'difficulty_level' => $practice->difficulty_level,
                'material' => [
                    'id' => $practice->material->id,
                    'name' => $practice->material->material_name,
                ],
            ],
            'teacher' => [
                'name' => $user->nama ?? $user->name ?? 'Dosen',
            ],
            'questions' => $questions,
            'authUser' => $user,
        ]);
    }

    /**
     * Show question editor page for a specific practice (dosen).
     */
    public function dosenEditPage(PracticeModel $practice)
    {
        $user = Auth::user();

        $practice->load(['material:id,material_name,created_by', 'questions.options', 'questions.items']);
        $isOwner = $practice->material && (int) $practice->material->created_by === (int) $user->id;
        abort_unless($isOwner || $user->role === 'superadmin', 403);

        $questions = $practice->questions
            ->sortBy('id')
            ->values()
            ->map(function (PracticeQuestionModel $q) {
                return [
                    'id' => $q->id,
                    'question_text' => $q->question_text,
                    'sub_topic' => $q->sub_topic,
                    'type' => $q->type ?? 'multiple_choice',
                    'points' => (int) ($q->points ?? 10),
                    'output_code' => $q->output_code,
                    'feedback_correct' => $q->feedback_correct,
                    'feedback_incorrect' => $q->feedback_incorrect,
                    'image_url' => $q->image_path ? asset('storage/' . $q->image_path) : null,
                    'options' => (($q->options->count() > 0)
                        ? $q->options->map(function (PracticeOptionModel $opt) {
                            return [
                                'id' => $opt->id,
                                'text' => $opt->option_text,
                                'is_correct' => (bool) $opt->is_correct,
                            ];
                        })
                        : $q->items->map(function (PracticeItemModel $item) {
                            return [
                                'id' => $item->id,
                                'text' => $item->item_text,
                                'is_correct' => false,
                            ];
                        }))->values(),
                ];
            });

        return Inertia::render('ManagePractices/Edit', [
            'practice' => [
                'id' => $practice->id,
                'difficulty_level' => $practice->difficulty_level,
                'material' => [
                    'id' => $practice->material->id,
                    'name' => $practice->material->material_name,
                ],
            ],
            'teacher' => [
                'name' => $user->nama ?? $user->name ?? 'Dosen',
            ],
            'questions' => $questions,
            'authUser' => $user,
        ]);
    }

    /**
     * Show read-only detail page for a specific practice (dosen).
     */
    public function dosenShowPage(PracticeModel $practice)
    {
        $user = Auth::user();

        $practice->load(['material:id,material_name,created_by', 'questions.options', 'questions.items']);
        $isOwner = $practice->material && (int) $practice->material->created_by === (int) $user->id;
        abort_unless($isOwner || $user->role === 'superadmin', 403);

        $questions = $practice->questions
            ->sortBy('id')
            ->values()
            ->map(function (PracticeQuestionModel $q) {
                return [
                    'id' => $q->id,
                    'question_text' => $q->question_text,
                    'sub_topic' => $q->sub_topic,
                    'type' => $q->type ?? 'multiple_choice',
                    'points' => (int) ($q->points ?? 10),
                    'output_code' => $q->output_code,
                    'feedback_correct' => $q->feedback_correct,
                    'feedback_incorrect' => $q->feedback_incorrect,
                    'image_url' => $q->image_path ? asset('storage/' . $q->image_path) : null,
                    'options' => (($q->options->count() > 0)
                        ? $q->options->map(function (PracticeOptionModel $opt) {
                            return [
                                'id' => $opt->id,
                                'text' => $opt->option_text,
                                'is_correct' => (bool) $opt->is_correct,
                            ];
                        })
                        : $q->items->map(function (PracticeItemModel $item) {
                            return [
                                'id' => $item->id,
                                'text' => $item->item_text,
                                'is_correct' => false,
                            ];
                        }))->values(),
                ];
            });

        return Inertia::render('ManagePractices/Show', [
            'practice' => [
                'id' => $practice->id,
                'difficulty_level' => $practice->difficulty_level,
                'material' => [
                    'id' => $practice->material->id,
                    'name' => $practice->material->material_name,
                ],
            ],
            'teacher' => [
                'name' => $user->nama ?? $user->name ?? 'Dosen',
            ],
            'questions' => $questions,
            'authUser' => $user,
        ]);
    }

    public function startAttempt(Request $request, PracticeModel $practice)
    {
        $userId = Auth::id();

        $data = $request->validate([
            'level' => ['required','in:easy,normal,medium,hard'],
            'question_type' => ['required','in:multiple_choice,drag_drop,mixed'],
            'question_count' => ['required','integer','min:1','max:50'],
            'material_name' => ['nullable','string'],
        ]);

        $requestedLevel = $data['level'] === 'medium' ? 'normal' : $data['level'];

        $hasRead = DB::table('user_progress')
            ->where('user_id', $userId)
            ->where('material_id', $practice->material_id)
            ->whereNotNull('read_at')
            ->exists();

        if (!$hasRead) {
            return back()->withErrors([
                'level' => 'Kamu perlu menyelesaikan membaca materi ini terlebih dahulu.',
            ]);
        }

        $adaptivePlan = $this->practiceService->getAdaptiveStartPlan(
            $userId,
            (int) $practice->material_id,
            $requestedLevel
        );

        $requiredLevel = $adaptivePlan['required_level'];
        if ($requiredLevel && $requestedLevel !== $requiredLevel) {
            return back()->withErrors([
                'level' => ($adaptivePlan['message'] ?? 'Kamu belum bisa memilih level ini.')
                    . ' Pilih level ' . strtoupper($requiredLevel === 'normal' ? 'MEDIUM' : $requiredLevel) . '.',
            ]);
        }

        $planPracticeId = $adaptivePlan['practice_id'] ?? null;
        if ($requiredLevel && $planPracticeId && (int) $practice->id !== (int) $planPracticeId) {
            return back()->withErrors([
                'level' => 'Level yang dipilih tidak cocok dengan alur adaptive untuk materi ini.',
            ]);
        }

        $attempt = PracticeAttemptModel::create([
            'user_id' => $userId,
            'practices_id' => $practice->id,
            'sub_topic_id' => $this->resolveSubTopicId((int) $practice->material_id, $adaptivePlan['weak_sub_topic'] ?? null),
            'attempt_mode' => $adaptivePlan['attempt_mode'] ?? 'regular',
            'attempt_type' => $this->mapAttemptType($adaptivePlan['attempt_mode'] ?? 'regular'),
            'attempt_no' => $this->resolveNextAttemptNo($userId, (int) $practice->id),
            'target_level' => $requestedLevel,
            'placement_level_result' => null,
            'source_from' => $data['level'],
            'next_action' => $adaptivePlan['action'] ?? null,
            'total_questions' => (int) $data['question_count'],
            'correct_answer' => 0,
            'score' => 0,
            'weak_sub_topic' => $adaptivePlan['weak_sub_topic'] ?? null,
            'remediation_round' => (int) ($adaptivePlan['remediation_round'] ?? 0),
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

        session([
            "attempt_cfg_{$attempt->id}" => [
                'level' => $requestedLevel,
                'question_type' => $data['question_type'],
                'question_count' => (int)$data['question_count'],
                'duration_seconds' => 18 * 60,
                'attempt_mode' => $adaptivePlan['attempt_mode'] ?? 'regular',
                'weak_sub_topic' => $adaptivePlan['weak_sub_topic'] ?? null,
                'remediation_round' => (int) ($adaptivePlan['remediation_round'] ?? 0),
            ],
        ]);

        return redirect()->route('practice_attempts.show', $attempt->id);
    }

    public function attemptDetail(PracticeAttemptModel $attempt)
    {
        abort_unless($attempt->user_id === Auth::id(), 403);

        $attempt->load(['practice.material']);

        $cfg = session("attempt_cfg_{$attempt->id}", [
            'level' => $attempt->target_level ?: $attempt->practice->difficulty_level,
            'question_type' => 'mixed',
            'question_count' => 10,
            'duration_seconds' => 18 * 60,
            'attempt_mode' => $attempt->attempt_mode ?: 'regular',
            'weak_sub_topic' => $attempt->weak_sub_topic,
            'remediation_round' => (int) ($attempt->remediation_round ?? 0),
        ]);

        $q = PracticeQuestionModel::query()
            ->where('practices_id', $attempt->practices_id);

        if (!empty($cfg['weak_sub_topic'])) {
            $q->where('sub_topic', $cfg['weak_sub_topic']);
        }

        if ($cfg['question_type'] !== 'mixed') {
            $q->where('type', $cfg['question_type']);
        }

        $questions = $q->with(['options','items'])
            ->inRandomOrder()
            ->limit($cfg['question_count'])
            ->get();

        if ($questions->isEmpty() && !empty($cfg['weak_sub_topic'])) {
            $fallback = PracticeQuestionModel::query()
                ->where('practices_id', $attempt->practices_id);

            if ($cfg['question_type'] !== 'mixed') {
                $fallback->where('type', $cfg['question_type']);
            }

            $questions = $fallback->with(['options','items'])
                ->inRandomOrder()
                ->limit($cfg['question_count'])
                ->get();
        }

        $savedAnswers = UserPracticeAnswerModel::query()
            ->where('practice_attempts_id', $attempt->id)
            ->get()
            ->keyBy('practice_questions_id');

        return Inertia::render('Practices/AttemptShow', [
            'attempt' => $attempt,
            'cfg' => $cfg,
            'questions' => $questions,
            'savedAnswers' => $savedAnswers,
        ]);
    }

    public function submitAnswers(Request $request, PracticeAttemptModel $attempt)
    {
        abort_unless($attempt->user_id === Auth::id(), 403);

        $data = $request->validate([
            'answers' => ['required','array'],
            'answers.*.type' => ['required','in:multiple_choice,drag_drop'],
            'answers.*.timespent' => ['nullable','integer','min:0'],
            'answers.*.option_id' => ['nullable','integer'],
            'answers.*.selection_items' => ['nullable','array'],
            'answers.*.selection_items.*' => ['string'],
        ]);

        DB::transaction(function () use ($attempt, $data) {
            $answersPayload = $data['answers'];
            $questionIds = array_map('intval', array_keys($answersPayload));

            $practiceMeta = PracticeModel::query()
                ->where('id', $attempt->practices_id)
                ->select('id', 'material_id', 'difficulty_level')
                ->first();

            $questions = PracticeQuestionModel::query()
                ->whereIn('id', $questionIds)
                ->with(['options','items'])
                ->get()
                ->keyBy('id');

            $mcCorrect = 0; $mcScore = 0;
            $dragCorrect = 0; $dragScore = 0;
            $totalEarned = 0;

            foreach ($answersPayload as $qid => $a) {
                $qid = (int)$qid;
                $question = $questions->get($qid);
                if (!$question) continue;

                $type = $a['type'];
                $timespent = (int)($a['timespent'] ?? 0);
                $questionPoints = (int)($question->points ?? 10);

                $isCorrect = false;
                $score = 0;
                $optionId = null;
                $selectionItems = null;

                if ($type === 'multiple_choice') {
                    $optionId = isset($a['option_id']) ? (int)$a['option_id'] : null;
                    $correctOpt = $question->options->firstWhere('is_correct', true);

                    $isCorrect = $correctOpt && $optionId && ($correctOpt->id === $optionId);
                    $score = $isCorrect ? $questionPoints : 0;

                    if ($isCorrect) { $mcCorrect++; $mcScore += $questionPoints; }
                } else {
                    $selectionItems = $a['selection_items'] ?? [];
                    $correctOrder = $question->items->pluck('item_text')->values()->all();

                    $isCorrect = ($selectionItems === $correctOrder);
                    $score = $isCorrect ? $questionPoints : 0;

                    if ($isCorrect) { $dragCorrect++; $dragScore += $questionPoints; }
                }

                $totalEarned += $score;

                $prevCount = UserPracticeAnswerModel::query()
                    ->where('practice_attempts_id', $attempt->id)
                    ->where('practice_questions_id', $qid)
                    ->count();

                UserPracticeAnswerModel::create([
                    'practice_attempts_id' => $attempt->id,
                    'practice_attempt_id' => $attempt->id,
                    'practice_questions_id' => $qid,
                    'practice_options_id' => $optionId,
                    'selected_option_id' => $optionId,
                    'attempt' => $prevCount + 1,
                    'selection_items' => $selectionItems,
                    'drag_answer' => $selectionItems,
                    'is_correct' => $isCorrect ? 1 : 0,
                    'score' => $score,
                    'timespent' => $timespent,
                ]);
            }

            $attempt->update([
                'finished_at' => now(),
                'mc_correct' => $mcCorrect,
                'mc_score' => $mcScore,
                'drag_correct' => $dragCorrect,
                'drag_score' => $dragScore,
                'total_earned' => $totalEarned,
                'final_score' => $totalEarned,
                'correct_answer' => $mcCorrect + $dragCorrect,
                'score' => $totalEarned,
                'placement_level_result' => ($attempt->attempt_type === 'pretest')
                    ? ($totalEarned < 60 ? 'easy' : ($totalEarned <= 80 ? 'medium' : 'hard'))
                    : null,
                'is_passed' => ($totalEarned >= 60) ? 1 : 0,
            ]);

            // Selesai materi jika Hard > 80.
            if ($practiceMeta && $practiceMeta->difficulty_level === 'hard' && $totalEarned > 80) {
                $classId = DB::table('class_user')
                    ->where('user_id', $attempt->user_id)
                    ->value('class_id');

                $progressQuery = DB::table('user_progress')
                    ->where('user_id', $attempt->user_id)
                    ->where('material_id', $practiceMeta->material_id);

                if (is_null($classId)) {
                    $progressQuery->whereNull('class_id');
                } else {
                    $progressQuery->where('class_id', $classId);
                }

                $existingProgress = $progressQuery->first();

                if ($existingProgress) {
                    $updateQuery = DB::table('user_progress')
                        ->where('id', $existingProgress->id);

                    $updateQuery->update([
                        'completed_practice_at' => now(),
                    ]);
                } else {
                    DB::table('user_progress')->insert([
                        'user_id' => $attempt->user_id,
                        'material_id' => $practiceMeta->material_id,
                        'class_id' => $classId,
                        'status' => 'in_progress',
                        'read_at' => null,
                        'completed_practice_at' => now(),
                        'completed_quiz_at' => null,
                    ]);
                }
            }
        });

        return redirect()->route('practices.summary', $attempt->practices_id);
    }

    /**
     * Save questions for a practice (bulk upsert) - dosen.
     */
    public function dosenSaveQuestions(Request $request, PracticeModel $practice)
    {
        $user = Auth::user();

        $practice->load('material:id,created_by');
        $isOwner = $practice->material && (int) $practice->material->created_by === (int) $user->id;
        abort_unless($isOwner || $user->role === 'superadmin', 403);

        $validated = $request->validate([
            'questions' => ['required', 'array', 'min:1'],
            'questions.*.id' => ['nullable', 'integer'],
            'questions.*.type' => ['nullable', Rule::in(['multiple_choice', 'drag_drop'])],
            'questions.*.question_text' => ['required', 'string'],
            'questions.*.sub_topic' => ['nullable', 'string', 'max:120'],
            'questions.*.points' => ['nullable', 'integer', 'min:1', 'max:100'],
            'questions.*.output_code' => ['nullable', 'string'],
            'questions.*.feedback_correct' => ['nullable', 'string'],
            'questions.*.feedback_incorrect' => ['nullable', 'string'],
            'questions.*.image' => ['nullable', 'image', 'max:2048'],
            'questions.*.options' => ['required', 'array', 'min:2'],
            'questions.*.options.*.text' => ['required', 'string'],
            'questions.*.options.*.is_correct' => ['required', 'boolean'],
        ]);

        DB::transaction(function () use ($practice, $validated, $request) {
            $questionsInput = $validated['questions'];

            $existing = $practice->questions()->with('options')->get()->keyBy('id');
            $keptIds = [];

            foreach ($questionsInput as $index => $qData) {
                $qid = isset($qData['id']) ? (int) $qData['id'] : null;

                if ($qid && $existing->has($qid)) {
                    $question = $existing->get($qid);
                } else {
                    $question = new PracticeQuestionModel();
                    $question->practices_id = $practice->id;
                }

                $question->question_text = $qData['question_text'];
                $question->sub_topic = !empty($qData['sub_topic']) ? trim($qData['sub_topic']) : null;
                $question->sub_topic_id = $this->resolveSubTopicId(
                    (int) $practice->material_id,
                    !empty($qData['sub_topic']) ? trim($qData['sub_topic']) : null
                );
                $question->type = $qData['type'] ?? 'multiple_choice';
                $question->question_type = $qData['type'] ?? 'multiple_choice';
                $question->points = $qData['points'] ?? 10;
                $question->output_code = $qData['output_code'] ?? null;

                $feedbackCorrect = $qData['feedback_correct'] ?? null;
                $feedbackIncorrect = $qData['feedback_incorrect'] ?? null;

                // default copy friendly message if not provided
                if (! $feedbackCorrect && ! $question->feedback_correct) {
                    $feedbackCorrect = 'Jawaban kamu benar.';
                }

                if ($feedbackCorrect !== null) {
                    $question->feedback_correct = $feedbackCorrect;
                }

                if ($feedbackIncorrect !== null) {
                    $question->feedback_incorrect = $feedbackIncorrect;
                }

                // handle image upload if present on this index (questions[index][image])
                $imageKey = "questions.$index.image";
                if ($request->hasFile($imageKey)) {
                    if ($question->image_path) {
                        Storage::disk('public')->delete($question->image_path);
                    }

                    $materialId = $practice->material_id ?? $practice->material->id ?? null;
                    $dir = $materialId ? "practices/{$materialId}" : 'practices';

                    $path = $request->file($imageKey)->store($dir, 'public');
                    $question->image_path = $path;
                }

                $question->save();

                $keptIds[] = $question->id;

                // Replace options
                $question->options()->delete();
                $question->items()->delete();

                foreach ($qData['options'] as $optData) {
                    PracticeOptionModel::create([
                        'practice_questions_id' => $question->id,
                        'option_text' => $optData['text'],
                        'is_correct' => $optData['is_correct'] ? 1 : 0,
                    ]);
                }

                if (($qData['type'] ?? 'multiple_choice') === 'drag_drop') {
                    foreach ($qData['options'] as $itemIndex => $optData) {
                        PracticeItemModel::create([
                            'practice_questions_id' => $question->id,
                            'item_text' => $optData['text'],
                            'order_number' => $itemIndex + 1,
                        ]);
                    }
                }
            }

            if (! empty($keptIds)) {
                PracticeQuestionModel::query()
                    ->where('practices_id', $practice->id)
                    ->whereNotIn('id', $keptIds)
                    ->delete();
            }
        });

        return redirect()->route('dosen.practices.edit', $practice->id)
            ->with('success', 'Pertanyaan latihan berhasil disimpan.');
    }

    /**
     * Upload image for a specific practice question (dosen).
     */
    public function uploadQuestionImage(Request $request, PracticeQuestionModel $question)
    {
        $user = Auth::user();

        $question->load('practice.material:id,created_by');

        $isOwner = $question->practice &&
            $question->practice->material &&
            (int) $question->practice->material->created_by === (int) $user->id;

        abort_unless($isOwner || $user->role === 'superadmin', 403);

        $data = $request->validate([
            'image' => ['required', 'image', 'max:2048'], // ~2MB
        ]);

        if ($question->image_path) {
            Storage::disk('public')->delete($question->image_path);
        }

        $materialId = optional($question->practice)->material_id;
        $dir = $materialId ? "practices/{$materialId}" : 'practices';

        $path = $request->file('image')->store($dir, 'public');

        $question->image_path = $path;
        $question->save();

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'image_url' => asset('storage/' . $path),
            ]);
        }

        return back()->with('success', 'Gambar soal berhasil diunggah.');
    }

    /**
     * Delete image for a specific practice question (dosen).
     */
    public function deleteQuestionImage(PracticeQuestionModel $question)
    {
        $user = Auth::user();

        $question->load('practice.material:id,created_by');

        $isOwner = $question->practice &&
            $question->practice->material &&
            (int) $question->practice->material->created_by === (int) $user->id;

        abort_unless($isOwner || $user->role === 'superadmin', 403);

        if ($question->image_path) {
            Storage::disk('public')->delete($question->image_path);
            $question->image_path = null;
            $question->save();
        }

        return back()->with('success', 'Gambar soal berhasil dihapus.');
    }

    /**
     * Delete a practice and all related data (dosen).
     */
    public function destroy(PracticeModel $practice)
    {
        $user = Auth::user();

        $practice->load(['material:id,created_by', 'questions', 'attempts']);

        abort_unless(
            $practice->material && (int) $practice->material->created_by === (int) $user->id,
            403,
        );

        DB::transaction(function () use ($practice) {
            // Hapus gambar soal dari storage
            foreach ($practice->questions as $question) {
                if ($question->image_path) {
                    Storage::disk('public')->delete($question->image_path);
                }
            }

            // Hapus jawaban user yang terkait dengan attempts latihan ini
            $attemptIds = $practice->attempts->pluck('id')->all();
            if (! empty($attemptIds)) {
                UserPracticeAnswerModel::query()
                    ->whereIn('practice_attempts_id', $attemptIds)
                    ->delete();
            }

            // Hapus relasi pada tiap pertanyaan (options, items, answers)
            foreach ($practice->questions as $question) {
                $question->options()->delete();
                $question->items()->delete();
                $question->answers()->delete();
            }

            // Hapus attempts dan pertanyaan
            $practice->attempts()->delete();
            $practice->questions()->delete();

            // Terakhir, hapus latihan itu sendiri
            $practice->delete();
        });

        if (request()->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return redirect()
            ->route('dosen.practices.index')
            ->with('success', 'Latihan soal berhasil dihapus.');
    }

    public function summary(PracticeModel $practice)
    {
        $userId = Auth::id();

        $practice->load('material');

        $lastAttempt = PracticeAttemptModel::query()
            ->where('user_id', $userId)
            ->where('practices_id', $practice->id)
            ->whereNotNull('finished_at')
            ->latest('finished_at')
            ->first();

        if (!$lastAttempt) {
            return redirect()->route('practices.index');
        }

        $answers = UserPracticeAnswerModel::query()
            ->where('practice_attempts_id', $lastAttempt->id)
            ->with([
                'question.options',
                'question.items',
                'option',
            ])
            ->get();

        $cfg = session("attempt_cfg_{$lastAttempt->id}", [
            'level' => $lastAttempt->target_level ?: $practice->difficulty_level,
            'question_type' => 'mixed',
            'question_count' => 10,
            'duration_seconds' => 18 * 60,
        ]);

        $nextLevelData = $this->practiceService->determineNextLevel(
            $userId,
            $practice->material_id,
            $cfg['level'] ?? $practice->difficulty_level,
            (int) $lastAttempt->final_score
        );

        return Inertia::render('Practices/Summary', [
            'practice' => $practice,
            'attempt' => $lastAttempt,
            'answers' => $answers,
            'cfg' => $cfg,
            'nextLevel' => $nextLevelData,
        ]);
    }

    private function mapAttemptType(string $attemptMode): string
    {
        if ($attemptMode === 'pretest') {
            return 'pretest';
        }

        if ($attemptMode === 'remedial') {
            return 'remedial';
        }

        return 'practice';
    }

    private function resolveNextAttemptNo(int $userId, int $practiceId): int
    {
        $latestNo = (int) (PracticeAttemptModel::query()
            ->where('user_id', $userId)
            ->where('practices_id', $practiceId)
            ->max('attempt_no') ?? 0);

        return $latestNo + 1;
    }

    private function resolveSubTopicId(int $materialId, ?string $subTopicName): ?int
    {
        if ($subTopicName === null || trim($subTopicName) === '') {
            return null;
        }

        $name = trim($subTopicName);

        $subTopic = SubTopicModel::query()->firstOrCreate([
            'material_id' => $materialId,
            'name' => $name,
        ]);

        return (int) $subTopic->id;
    }
}
