<?php

namespace App\Http\Controllers\Dosen;

use App\Http\Controllers\Controller;
use App\Models\ClassModel;
use App\Models\MaterialModel;
use App\Models\QuizMapModel;
use App\Models\QuizModel;
use App\Models\QuizOptionModel;
use App\Services\QuizService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class QuizController extends Controller
{
    protected QuizService $quizService;

    public function __construct(QuizService $quizService)
    {
        $this->quizService = $quizService;
    }

    public function dosenIndexPage()
    {
        $user = Auth::user();

        if ($user && $user->role === 'superadmin') {
            $quizzes = $this->quizService->getQuizzesForAdmin();

            $classes = ClassModel::query()
                ->orderBy('class_name')
                ->get(['id', 'class_name']);
        } else {
            $userId = $user?->id;

            $quizzes = $this->quizService->getQuizzesForLecturer($userId);

            $classes = ClassModel::query()
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
            $classes = ClassModel::query()
                ->orderBy('class_name')
                ->get(['id', 'class_name']);

            $materials = MaterialModel::query()
                ->orderBy('material_name')
                ->get(['id', 'material_name']);
        } else {
            $classes = ClassModel::query()
                ->where('created_by', $user->id)
                ->orderBy('class_name')
                ->get(['id', 'class_name']);

            $materials = MaterialModel::query()
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
            $classes = ClassModel::query()
                ->orderBy('class_name')
                ->get(['id', 'class_name']);
        } else {
            $classes = ClassModel::query()
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
                'start_at' => $quiz->start_at ? \Carbon\Carbon::parse($quiz->start_at)->format('Y-m-d\TH:i') : '',
                'end_at' => $quiz->end_at ? \Carbon\Carbon::parse($quiz->end_at)->format('Y-m-d\TH:i') : '',
            ],
            'questions' => $questions,
            'authUser' => $user,
        ]);
    }

    public function saveQuestions(Request $request, QuizModel $quiz)
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

                $imageKey = "questions.$index.image";
                if ($request->hasFile($imageKey)) {
                    if ($question->image_path) {
                        Storage::disk('public')->delete($question->image_path);
                    }
                    $path = $request->file($imageKey)->store('quizzes', 'public');
                    $question->image_path = $path;
                }

                $question->save();

                $keptQuestionIds[] = $question->id;

                QuizMapModel::updateOrCreate(
                    [
                        'quiz_id' => $quiz->id,
                        'quiz_question_id' => $question->id,
                    ],
                    [
                        'points' => $qData['points'] ?? 10,
                    ]
                );

                $question->options()->delete();
                foreach ($qData['options'] as $optData) {
                    QuizOptionModel::create([
                        'quiz_questions_id' => $question->id,
                        'option_text' => $optData['text'],
                        'is_correct' => $optData['is_correct'] ? 1 : 0,
                    ]);
                }
            }

            if (!empty($keptQuestionIds)) {
                $unkept = QuizMapModel::where('quiz_id', $quiz->id)
                    ->whereNotIn('quiz_question_id', $keptQuestionIds)->get();
                foreach ($unkept as $u) {
                    $u->delete();
                }
            } else {
                QuizMapModel::where('quiz_id', $quiz->id)->delete();
            }
        });

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
            ->map(fn($id) => (int) $id)
            ->unique()
            ->reject(fn($id) => $id === (int) $quiz->class_id)
            ->values();

        if ($classIds->isEmpty()) {
            return back()->with('success', 'Tidak ada kelas baru yang dipilih untuk duplikasi.');
        }

        $quiz->load(['materials', 'questions.options']);

        DB::transaction(function () use ($quiz, $classIds, $user) {
            $materialIds = $quiz->materials->pluck('id')->all();
            $questions = $quiz->questions;

            foreach ($classIds as $classId) {
                if ($user->role !== 'superadmin') {
                    $ownsClass = ClassModel::where('id', $classId)
                        ->where('created_by', $user->id)
                        ->exists();

                    if (!$ownsClass) {
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

                if (!empty($materialIds)) {
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
