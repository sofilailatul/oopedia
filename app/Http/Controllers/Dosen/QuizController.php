<?php

namespace App\Http\Controllers\Dosen;

use App\Http\Controllers\Controller;
use App\Models\ClassModel;
use App\Models\MaterialModel;
use App\Models\QuizMapModel;
use App\Models\QuizModel;
use App\Models\QuizQuestionsModel;  
use App\Models\QuizOptionModel;
use App\Models\QuizAttemptMaterialScoreModel;
use App\Models\QuizAttemptModel;
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
            ->with('subTopics')
            ->orderBy('material_name')
            ->get();

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

        // Find sibling quizzes (same content, different class)
        $siblings = QuizModel::query()
            ->where('title', $quiz->title)
            ->where('duration', $quiz->duration)
            ->where('passing_score', $quiz->passing_score)
            ->where('created_by', $quiz->created_by)
            ->with('class')
            ->get();

        $classes = $siblings->map(fn($s) => [
            'id'         => $s->id,
            'class_name' => $s->class?->class_name ?? 'Unknown Class',
        ])->values();

        return Inertia::render('ManageQuizzes/Show', [
            'quiz' => [
                'id'           => $quiz->id,
                'title'        => $quiz->title,
                'description'  => $quiz->description ?? null,
                'class_name'   => $quiz->class?->class_name ?? 'Unknown Class',
                'classes'      => $classes,
                'duration'     => $quiz->duration,
                'passing_score' => $quiz->passing_score,
                'start_at'     => $quiz->start_at,
                'end_at'       => $quiz->end_at,
                'materials'    => $materials,
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
                ->with('subTopics')
                ->orderBy('material_name')
                ->get();
        } else {
            $classes = ClassModel::query()
                ->where('created_by', $user->id)
                ->orderBy('class_name')
                ->get(['id', 'class_name']);

            $materials = MaterialModel::query()
                ->where('created_by', $user->id)
                ->with('subTopics')
                ->orderBy('material_name')
                ->get();
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

                // Aktif kalau kolom subtopic_id sudah ada
                'subtopic_id' => $q->subtopic_id ?? null,

                'quiz_text' => $q->quiz_text,
                'question_text' => $q->quiz_text,

                'image_path' => $q->image_path,
                'image_url' => $q->image_path ? asset('storage/' . $q->image_path) : null,

                'feedback_correct' => $q->feedback_correct,
                'feedbackCorrect' => $q->feedback_correct,

                'feedback_incorrect' => $q->feedback_incorrect,
                'feedbackIncorrect' => $q->feedback_incorrect,

                'points' => (int) ($q->pivot->points ?? 1),

                'options' => $q->options->map(function ($opt) {
                    return [
                        'id' => $opt->id,
                        'text' => $opt->option_text,
                        'option_text' => $opt->option_text,
                        'is_correct' => (bool) $opt->is_correct,
                    ];
                })->values(),
            ];
        })->values();

        $materials = $quiz->materials()
            ->with('subTopics')
            ->orderBy('material_name')
            ->get()
            ->map(function ($material) {
                return [
                    'id' => $material->id,
                    'material_name' => $material->material_name,

                    'subtopics' => $material->subTopics->map(function ($subtopic) {
                        return [
                            'id' => $subtopic->id,
                            'name' => $subtopic->subtopic_name
                                ?? $subtopic->sub_topic_name
                                ?? $subtopic->name,
                        ];
                    })->values(),
                ];
            })
            ->values();

        $existingClassIds = QuizModel::query()
            ->where('title', $quiz->title)
            ->where('duration', $quiz->duration)
            ->where('passing_score', $quiz->passing_score)
            ->where('created_by', $quiz->created_by)
            ->pluck('class_id')
            ->filter()
            ->values()
            ->all();

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
                'start_at' => $quiz->start_at
                    ? \Carbon\Carbon::parse($quiz->start_at)->format('Y-m-d\TH:i')
                    : '',
                'end_at' => $quiz->end_at
                    ? \Carbon\Carbon::parse($quiz->end_at)->format('Y-m-d\TH:i')
                    : '',
                'existing_class_ids' => $existingClassIds,
            ],
            'questions' => $questions,
            'authUser' => $user,
        ]);
    }

    public function downloadTemplate(QuizModel $quiz)
    {
        $user = Auth::user();

        $canManage = (int) $quiz->created_by === (int) $user->id
            || $user->role === 'superadmin';

        abort_unless($canManage, 403);

        $materials = $quiz->materials()
            ->with('subTopics')
            ->orderBy('material_name')
            ->get();

        $header = [
            'Materi',
            'Subtopik',
            'Pertanyaan',
            'Opsi A',
            'Opsi B',
            'Opsi C',
            'Opsi D',
            'Jawaban',
            'Poin',
            'Feedback Benar',
            'Feedback Salah',
        ];

        $rows = [];

        foreach ($materials as $material) {
            $subtopicNames = $material->subTopics
                ->map(function ($sub) {
                    return $sub->subtopic_name
                        ?? $sub->sub_topic_name
                        ?? $sub->name;
                })
                ->filter()
                ->values()
                ->all();

            $rows[] = [
                $material->material_name,
                $subtopicNames
                    ? ('SUBTOPIK: ' . implode(' | ', $subtopicNames))
                    : 'SUBTOPIK: -',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
            ];
        }

        $rows[] = [
            $materials->first()?->material_name ?? '',
            $materials->first()?->subTopics->first()?->name
                ?? $materials->first()?->subTopics->first()?->subtopic_name
                ?? $materials->first()?->subTopics->first()?->sub_topic_name
                ?? '',
            'Contoh soal 1',
            'Jawaban A',
            'Jawaban B',
            'Jawaban C',
            'Jawaban D',
            'A',
            '10',
            'Jawaban kamu benar.',
            'Jawaban kamu salah.',
        ];

        $escape = static fn ($value) => '"' . str_replace('"', '""', (string) $value) . '"';

        $lines = [];
        $lines[] = implode(',', array_map($escape, $header));
        foreach ($rows as $row) {
            $lines[] = implode(',', array_map($escape, $row));
        }

        $filename = "template_quiz_{$quiz->id}.csv";

        return response(implode("\n", $lines), 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename={$filename}",
        ]);
    }

    public function saveQuestions(Request $request, QuizModel $quiz)
    {
        $user = Auth::user();

        $canManage = (int) $quiz->created_by === (int) $user->id
            || $user->role === 'superadmin';

        abort_unless($canManage, 403);

        $validated = $request->validate([
            'class_ids' => ['required', 'array', 'min:1'],
            'class_ids.*' => ['integer', 'exists:classes,id'],

            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],

            'duration' => ['required', 'integer', 'min:1'],
            'passing_score' => ['required', 'integer', 'min:0', 'max:100'],
            'start_at' => ['nullable', 'date'],
            'end_at' => ['nullable', 'date'],

            'material_ids' => ['nullable', 'array'],
            'material_ids.*' => ['integer', 'exists:materials,id'],

            'questions' => ['nullable', 'array'],
            'questions.*.id' => ['nullable', 'integer', 'exists:quiz_questions,id'],
            'questions.*.material_id' => ['nullable', 'integer', 'exists:materials,id'],
            'questions.*.subtopic_id' => ['nullable', 'integer', 'exists:subtopics,id'],
            'questions.*.quiz_text' => ['required', 'string'],
            'questions.*.points' => ['nullable', 'integer', 'min:1', 'max:100'],
            'questions.*.feedback_correct' => ['nullable', 'string'],
            'questions.*.feedback_incorrect' => ['nullable', 'string'],
            'questions.*.image' => ['nullable', 'image', 'max:2048'],

            'questions.*.options' => ['required', 'array', 'min:2'],
            'questions.*.options.*.text' => ['required', 'string'],
            'questions.*.options.*.is_correct' => ['required', 'boolean'],
        ]);

        $classIds = collect($validated['class_ids'])
            ->unique()
            ->values();

        DB::transaction(function () use ($quiz, $validated, $request, $user, $classIds) {
            /*
            |--------------------------------------------------------------------------
            | 1. Ambil semua quiz sibling
            |--------------------------------------------------------------------------
            | Karena satu quiz dibuat per class_id, kita anggap quiz yang sama adalah:
            | title + duration + passing_score + created_by.
            */
            $siblings = QuizModel::query()
                ->where('title', $quiz->title)
                ->where('duration', $quiz->duration)
                ->where('passing_score', $quiz->passing_score)
                ->where('created_by', $quiz->created_by)
                ->get();

            $existingClassMap = $siblings->keyBy('class_id');

            $activeQuizIds = [];

            /*
            |--------------------------------------------------------------------------
            | 2. Update quiz yang sudah ada / buat quiz baru untuk class baru
            |--------------------------------------------------------------------------
            */
            foreach ($classIds as $classId) {
                if ($existingClassMap->has($classId)) {
                    $classQuiz = $existingClassMap->get($classId);

                    $classQuiz->update([
                        'title' => $validated['title'],
                        'duration' => $validated['duration'],
                        'passing_score' => $validated['passing_score'],
                        'start_at' => $validated['start_at'] ?? null,
                        'end_at' => $validated['end_at'] ?? null,
                    ]);
                } else {
                    $classQuiz = QuizModel::create([
                        'title' => $validated['title'],
                        'class_id' => $classId,
                        'created_by' => $user->id,
                        'duration' => $validated['duration'],
                        'passing_score' => $validated['passing_score'],
                        'start_at' => $validated['start_at'] ?? null,
                        'end_at' => $validated['end_at'] ?? null,
                    ]);
                }

                if (!empty($validated['material_ids'])) {
                    $classQuiz->materials()->sync($validated['material_ids']);
                }

                $activeQuizIds[] = $classQuiz->id;
            }

            /*
            |--------------------------------------------------------------------------
            | 3. Hapus quiz sibling yang class-nya sudah tidak dipilih
            |--------------------------------------------------------------------------
            */
            $toDelete = $siblings->whereNotIn('class_id', $classIds);

            foreach ($toDelete as $deletedQuiz) {
                QuizMapModel::where('quiz_id', $deletedQuiz->id)->delete();
                $deletedQuiz->materials()->detach();
                $deletedQuiz->delete();
            }

            /*
            |--------------------------------------------------------------------------
            | 4. Simpan pertanyaan sekali, lalu hubungkan ke semua quiz aktif
            |--------------------------------------------------------------------------
            */
            $questionsInput = $validated['questions'] ?? [];
            $keptQuestionIds = [];

            foreach ($questionsInput as $index => $questionData) {
                $questionId = $questionData['id'] ?? null;

                $question = $questionId
                    ? QuizQuestionsModel::find($questionId)
                    : new QuizQuestionsModel();

                if (!$question) {
                    $question = new QuizQuestionsModel();
                }

                $question->material_id = $questionData['material_id'] ?? null;

                // Aktifkan kalau kolom subtopic_id sudah ditambahkan ke tabel quiz_questions
                $question->subtopic_id = $questionData['subtopic_id'] ?? null;

                $question->quiz_text = $questionData['quiz_text'];
                $question->feedback_correct = $questionData['feedback_correct'] ?? 'Jawaban kamu benar.';
                $question->feedback_incorrect = $questionData['feedback_incorrect'] ?? 'Jawaban kamu salah.';

                $imageKey = "questions.$index.image";

                if ($request->hasFile($imageKey)) {
                    if ($question->image_path) {
                        Storage::disk('public')->delete($question->image_path);
                    }

                    $question->image_path = $request
                        ->file($imageKey)
                        ->store('quizzes', 'public');
                }

                $question->save();

                $keptQuestionIds[] = $question->id;

                /*
                |--------------------------------------------------------------------------
                | 5. Hubungkan question yang sama ke semua quiz beda kelas
                |--------------------------------------------------------------------------
                */
                foreach ($activeQuizIds as $activeQuizId) {
                    QuizMapModel::updateOrCreate(
                        [
                            'quiz_id' => $activeQuizId,
                            'quiz_question_id' => $question->id,
                        ],
                        [
                            'points' => $questionData['points'] ?? 10,
                        ],
                    );
                }

                /*
                |--------------------------------------------------------------------------
                | 6. Karena options nempel ke question, cukup simpan sekali
                |--------------------------------------------------------------------------
                */
                $question->options()->delete();

                foreach ($questionData['options'] as $optionData) {
                    QuizOptionModel::create([
                        'quiz_questions_id' => $question->id,
                        'option_text' => $optionData['text'],
                        'is_correct' => $optionData['is_correct'] ? 1 : 0,
                    ]);
                }
            }

            /*
            |--------------------------------------------------------------------------
            | 7. Bersihkan mapping pertanyaan yang sudah dihapus dari form
            |--------------------------------------------------------------------------
            */
            foreach ($activeQuizIds as $activeQuizId) {
                QuizMapModel::where('quiz_id', $activeQuizId)
                    ->whereNotIn('quiz_question_id', $keptQuestionIds)
                    ->delete();
            }

            /*
            |--------------------------------------------------------------------------
            | 8. Hapus question yang sudah tidak dipakai quiz mana pun
            |--------------------------------------------------------------------------
            */
            $orphanQuestions = QuizQuestionsModel::query()
                ->whereDoesntHave('quizzes')
                ->get();

            foreach ($orphanQuestions as $orphanQuestion) {
                if ($orphanQuestion->image_path) {
                    Storage::disk('public')->delete($orphanQuestion->image_path);
                }

                $orphanQuestion->options()->delete();
                $orphanQuestion->delete();
            }
        });

        $routeName = $user->role === 'superadmin'
            ? 'superadmin.quizzes.index'
            : 'dosen.quizzes.index';

        return redirect()
            ->route($routeName)
            ->with('success', 'Kuis berhasil diperbarui dan pertanyaan disinkronkan ke semua kelas.');
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

    public function destroy(QuizModel $quiz)
    {
        $user = Auth::user();

        $canManage = (int) $quiz->created_by === (int) $user->id
            || $user->role === 'superadmin';

        abort_unless($canManage, 403);

        DB::transaction(function () use ($quiz) {
            // 1. Cari semua quiz yang dianggap "sama" (sibling) di kelas-kelas lain
            // Kriterianya: judul, durasi, passing_score, dan pembuat yang sama
            $siblings = QuizModel::query()
                ->where('title', $quiz->title)
                ->where('duration', $quiz->duration)
                ->where('passing_score', $quiz->passing_score)
                ->where('created_by', $quiz->created_by)
                ->get();

            $siblingIds = $siblings->pluck('id');

            // 2. Ambil semua ID pertanyaan yang terhubung ke quiz-quiz ini
            $questionIds = QuizMapModel::whereIn('quiz_id', $siblingIds)
                ->pluck('quiz_question_id')
                ->unique();

            // 3. Hapus mapping (pivot) untuk semua quiz sibling ini
            QuizMapModel::whereIn('quiz_id', $siblingIds)->delete();

            // 4. Untuk setiap pertanyaan, cek apakah masih dipakai oleh quiz lain (di luar grup sibling ini)
            // Jika tidak, hapus pertanyaan tersebut beserta opsi dan gambarnya.
            foreach ($questionIds as $qid) {
                $stillLinked = QuizMapModel::where('quiz_question_id', $qid)->exists();
                
                if (!$stillLinked) {
                    $q = QuizQuestionsModel::find($qid);
                    if ($q) {
                        // Hapus opsi
                        $q->options()->delete();

                        // Hapus gambar
                        if ($q->image_path) {
                            Storage::disk('public')->delete($q->image_path);
                        }

                        // Hapus pertanyaan
                        $q->delete();
                    }
                }
            }

            // 5. Lepaskan relasi materi dan hapus semua quiz sibling
            foreach ($siblings as $s) {
                $s->materials()->detach();
                $s->delete();
            }
        });

        $routeName = $user->role === 'superadmin'
            ? 'superadmin.quizzes.index'
            : 'dosen.quizzes.index';

        return redirect()->route($routeName)->with('success', 'Kuis berhasil dihapus.');
    }

    public function questionDestroy(QuizQuestionsModel $question)
    {
        $user = Auth::user();

        // Ensure the authenticated user owns at least one quiz this question belongs to
        $ownsQuestion = QuizMapModel::where('quiz_question_id', $question->id)
            ->whereHas('quiz', function ($q) use ($user) {
                if ($user->role !== 'superadmin') {
                    $q->where('created_by', $user->id);
                }
            })
            ->exists();

        abort_unless($ownsQuestion || $user->role === 'superadmin', 403);

        DB::transaction(function () use ($question) {
            // Remove from pivot table
            QuizMapModel::where('quiz_question_id', $question->id)->delete();

            // Delete options
            $question->options()->delete();

            // Delete image if present
            if ($question->image_path) {
                Storage::disk('public')->delete($question->image_path);
            }

            $question->delete();
        });

        return back()->with('success', 'Soal berhasil dihapus.');
    }
}
