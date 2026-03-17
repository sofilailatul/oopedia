<?php

namespace App\Http\Controllers;

use App\Services\PracticeService;
use App\Models\PracticeAttemptModel;
use App\Models\PracticeModel;
use App\Models\PracticeQuestionModel;
use App\Models\PracticeOptionModel;
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
        $userId = auth()->id();
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
        $userId = auth()->id();
        $practices = $this->practiceService->getPracticesForLecturer($userId);

        $materials = MaterialModel::query()
            ->where('created_by', $userId)
            ->orderBy('material_name')
            ->get(['id', 'material_name']);

        return Inertia::render('Dosen/Practices/Index', [
            'practices' => $practices,
            'materials' => $materials,
        ]);
    }

    /**
     * Store a new practice (per material & difficulty) for lecturer.
     */
    public function store(Request $request)
    {
        $userId = auth()->id();

        $data = $request->validate([
            'material_id' => ['required', 'integer', 'exists:materials,id'],
            'difficulty_level' => ['required', 'in:easy,normal,hard'],
        ]);

        $material = MaterialModel::query()
            ->where('id', $data['material_id'])
            ->where('created_by', $userId)
            ->firstOrFail();

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
            'difficulty_level' => $data['difficulty_level'],
        ]);

        return redirect()->route('dosen.practices.edit', $practice->id)
            ->with('success', 'Latihan soal berhasil dibuat.');
    }

    /**
     * Show question editor page for a specific practice (dosen).
     */
    public function dosenEditPage(PracticeModel $practice)
    {
        $user = auth()->user();

        $practice->load(['material:id,material_name,created_by', 'questions.options']);

        abort_unless($practice->material && (int) $practice->material->created_by === (int) $user->id, 403);

        $questions = $practice->questions
            ->sortBy('id')
            ->values()
            ->map(function (PracticeQuestionModel $q) {
                return [
                    'id' => $q->id,
                    'question_text' => $q->question_text,
                    'type' => $q->type ?? 'multiple_choice',
                    'points' => (int) ($q->points ?? 10),
                    'output_code' => $q->output_code,
                    'feedback_correct' => $q->feedback_correct,
                    'feedback_incorrect' => $q->feedback_incorrect,
                    'image_url' => $q->image_path ? asset('storage/' . $q->image_path) : null,
                    'options' => $q->options->map(function (PracticeOptionModel $opt) {
                        return [
                            'id' => $opt->id,
                            'text' => $opt->option_text,
                            'is_correct' => (bool) $opt->is_correct,
                        ];
                    })->values(),
                ];
            });

        return Inertia::render('Dosen/Practices/Edit', [
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
        ]);
    }

    /**
     * Show read-only detail page for a specific practice (dosen).
     */
    public function dosenShowPage(PracticeModel $practice)
    {
        $user = auth()->user();

        $practice->load(['material:id,material_name,created_by', 'questions.options']);

        abort_unless($practice->material && (int) $practice->material->created_by === (int) $user->id, 403);

        $questions = $practice->questions
            ->sortBy('id')
            ->values()
            ->map(function (PracticeQuestionModel $q) {
                return [
                    'id' => $q->id,
                    'question_text' => $q->question_text,
                    'type' => $q->type ?? 'multiple_choice',
                    'points' => (int) ($q->points ?? 10),
                    'output_code' => $q->output_code,
                    'feedback_correct' => $q->feedback_correct,
                    'feedback_incorrect' => $q->feedback_incorrect,
                    'image_url' => $q->image_path ? asset('storage/' . $q->image_path) : null,
                    'options' => $q->options->map(function (PracticeOptionModel $opt) {
                        return [
                            'id' => $opt->id,
                            'text' => $opt->option_text,
                            'is_correct' => (bool) $opt->is_correct,
                        ];
                    })->values(),
                ];
            });

        return Inertia::render('Dosen/Practices/Show', [
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
        ]);
    }

    public function startAttempt(Request $request, PracticeModel $practice)
    {
        $userId = auth()->id();

        $data = $request->validate([
            'level' => ['required','in:easy,normal,hard'],
            'question_type' => ['required','in:multiple_choice,drag_drop,mixed'],
            'question_count' => ['required','integer','min:1','max:50'],
            'material_name' => ['nullable','string'],
        ]);

        if ($data['level'] !== 'normal') {
            $normalPractice = PracticeModel::query()
                ->where('material_id', $practice->material_id)
                ->where('difficulty_level', 'normal')
                ->first();

            if ($normalPractice) {
                $hasFinishedNormal = PracticeAttemptModel::query()
                    ->where('user_id', $userId)
                    ->where('practices_id', $normalPractice->id)
                    ->whereNotNull('finished_at')
                    ->exists();

                if (!$hasFinishedNormal) {
                    return back()->withErrors([
                        'level' => 'Kamu wajib menyelesaikan level NORMAL terlebih dahulu.',
                    ]);
                }
            }
        }

        $attempt = PracticeAttemptModel::create([
            'user_id' => $userId,
            'practices_id' => $practice->id,
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

        // simpan config di session (tanpa alter table)
        session([
            "attempt_cfg_{$attempt->id}" => [
                'level' => $data['level'],
                'question_type' => $data['question_type'],
                'question_count' => (int)$data['question_count'],
                'duration_seconds' => 18 * 60, 
            ],
        ]);

        logger()->info('startAttempt', [
            'auth_id' => auth()->id(),
            'attempt_count' => \App\Models\PracticeAttemptModel::where('user_id', auth()->id())->count(),
            ]);

        return redirect()->route('practice_attempts.show', $attempt->id);
    }

    public function attemptDetail(PracticeAttemptModel $attempt)
    {
        abort_unless($attempt->user_id === auth()->id(), 403);

        $attempt->load(['practice.material']);

        $cfg = session("attempt_cfg_{$attempt->id}", [
            'level' => $attempt->practice->difficulty_level,
            'question_type' => 'mixed',
            'question_count' => 10,
            'duration_seconds' => 18 * 60,
        ]);

        $q = PracticeQuestionModel::query()
            ->where('practices_id', $attempt->practices_id);

        if ($cfg['question_type'] !== 'mixed') {
            $q->where('type', $cfg['question_type']);
        }

        $questions = $q->with(['options','items'])
            ->inRandomOrder()
            ->limit($cfg['question_count'])
            ->get();

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
        abort_unless($attempt->user_id === auth()->id(), 403);

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

                $isCorrect = false;
                $score = 0;
                $optionId = null;
                $selectionItems = null;

                if ($type === 'multiple_choice') {
                    $optionId = isset($a['option_id']) ? (int)$a['option_id'] : null;
                    $correctOpt = $question->options->firstWhere('is_correct', true);

                    $isCorrect = $correctOpt && $optionId && ($correctOpt->id === $optionId);
                    $score = $isCorrect ? 50 : 0;

                    if ($isCorrect) { $mcCorrect++; $mcScore += 50; }
                } else {
                    $selectionItems = $a['selection_items'] ?? [];
                    $correctOrder = $question->items->pluck('item_text')->values()->all();

                    $isCorrect = ($selectionItems === $correctOrder);
                    $score = $isCorrect ? 50 : 0;

                    if ($isCorrect) { $dragCorrect++; $dragScore += 50; }
                }

                $totalEarned += $score;

                $prevCount = UserPracticeAnswerModel::query()
                    ->where('practice_attempts_id', $attempt->id)
                    ->where('practice_questions_id', $qid)
                    ->count();

                UserPracticeAnswerModel::create([
                    'practice_attempts_id' => $attempt->id,
                    'practice_questions_id' => $qid,
                    'practice_options_id' => $optionId,
                    'attempt' => $prevCount + 1,
                    'selection_items' => $selectionItems,
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
                'is_passed' => ($totalEarned >= 60) ? 1 : 0,
            ]);
        });

        return redirect()->route('practices.summary', $attempt->practices_id);
    }

    /**
     * Save questions for a practice (bulk upsert) - dosen.
     */
    public function dosenSaveQuestions(Request $request, PracticeModel $practice)
    {
        $user = auth()->user();

        $practice->load('material:id,created_by');

        abort_unless($practice->material && (int) $practice->material->created_by === (int) $user->id, 403);

        $validated = $request->validate([
            'questions' => ['required', 'array', 'min:1'],
            'questions.*.id' => ['nullable', 'integer'],
            'questions.*.type' => ['nullable', Rule::in(['multiple_choice', 'drag_drop'])],
            'questions.*.question_text' => ['required', 'string'],
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
                $question->type = $qData['type'] ?? 'multiple_choice';
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
                foreach ($qData['options'] as $optData) {
                    PracticeOptionModel::create([
                        'practice_questions_id' => $question->id,
                        'option_text' => $optData['text'],
                        'is_correct' => $optData['is_correct'] ? 1 : 0,
                    ]);
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
        $user = auth()->user();

        $question->load('practice.material:id,created_by');

        abort_unless(
            $question->practice &&
            $question->practice->material &&
            (int) $question->practice->material->created_by === (int) $user->id,
            403
        );

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
        $user = auth()->user();

        $question->load('practice.material:id,created_by');

        abort_unless(
            $question->practice &&
            $question->practice->material &&
            (int) $question->practice->material->created_by === (int) $user->id,
            403
        );

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
        $user = auth()->user();

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
        $userId = auth()->id();

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
            ->with('question') // kalau relasi belum ada, skip
            ->get();

        $cfg = session("attempt_cfg_{$lastAttempt->id}", [
            'level' => $practice->difficulty_level,
            'question_type' => 'mixed',
            'question_count' => 10,
            'duration_seconds' => 18 * 60,
        ]);

        return Inertia::render('Practices/Summary', [
            'practice' => $practice,
            'attempt' => $lastAttempt,
            'answers' => $answers,
            'cfg' => $cfg,
        ]);
    }
}
