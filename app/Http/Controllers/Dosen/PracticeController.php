<?php

namespace App\Http\Controllers\Dosen;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

use App\Models\PracticeModel;
use App\Models\PracticeQuestionModel;
use App\Models\PracticeOptionModel;
use App\Models\PracticeItemModel;
use App\Models\MaterialModel;
use App\Models\SubTopicModel;
use App\Services\PracticeService;

class PracticeController extends Controller
{
    protected $practiceService;

    public function __construct(PracticeService $practiceService)
    {
        $this->practiceService = $practiceService;
    }

    private function getQuestionCounts()
    {
        return PracticeQuestionModel::query()
            ->select('practices_id', 'type', DB::raw('COUNT(*) as total'))
            ->groupBy('practices_id', 'type')
            ->get()
            ->groupBy('practices_id')
            ->map(function ($rows) {
                return $rows->pluck('total', 'type');
            });
    }
    
    public function getPracticesForAdmin()
    {
        $questionCounts = $this->getQuestionCounts();

        $practiceRows = PracticeModel::query()
            ->join('materials', 'materials.id', '=', 'practices.material_id')
            ->select('practices.*', 'materials.material_name')
            ->orderBy('materials.material_name')
            ->orderBy('practices.level')
            ->get();

        return $practiceRows->map(function ($row) use ($questionCounts) {
            $counts = $questionCounts->get($row->id, collect());
            $totalQuestions = $counts instanceof \Illuminate\Support\Collection
                ? (int) $counts->sum()
                : 0;

            return [
                'id' => $row->id,
                'material_id' => $row->material_id,
                'material_name' => $row->material_name,
                'type' => $row->type ?? 'practice',
                'level' => $row->level,
                'total_questions' => $totalQuestions,
            ];
        });
    }

    public function getPracticesForLecturer($lecturerId)
    {
        return PracticeModel::query()
            ->withCount('questions') // otomatis hitung soal
            ->with('material:id,material_name')
            ->whereHas('material', function ($q) use ($lecturerId) {
                $q->where('created_by', $lecturerId);
            })
            ->orderBy('material_id')
            ->orderBy('level') 
            ->get()
            ->map(function ($practice) {
                return [
                    'id' => $practice->id,
                    'material_id' => $practice->material_id,
                    'material_name' => $practice->material->material_name ?? '-',
                    'type' => $practice->type,
                    'level' => $practice->level, 
                    'total_questions' => $practice->questions_count, 
                ];
            });
    }


    public function index()
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
    
    public function create(PracticeModel $practice)
    {
        $user = Auth::user();

        $practice->load(['material:id,material_name,created_by', 'questions.options', 'questions.items', 'questions.subTopicRef']);
        $isOwner = $practice->material && (int) $practice->material->created_by === (int) $user->id;
        abort_unless($isOwner || $user->role === 'superadmin', 403);

        $questions = $practice->questions
            ->sortBy('id')
            ->values()
            ->map(function (PracticeQuestionModel $q) use ($practice) {
                return [
                    'id' => $q->id,
                    'question_text' => $q->question_text,
                    'subtopic_id' => $q->subtopic_id,
                    'sub_topic_name' => $q->subTopicRef->name ?? null,
                    'material_id' => $practice->material_id,
                    'type' => $q->type ?? 'multiple_choice',
                    'points' => (int) ($q->points ?? 10),
                    'code_snippet' => $q->code_snippet,
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

        $subtopics = SubTopicModel::query()
            ->where('material_id', $practice->material_id)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn ($s) => ['id' => $s->id, 'name' => $s->name]);

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
            'subtopics' => $subtopics,
            'authUser' => $user,
        ]);
    }

    public function edit(PracticeModel $practice)
    {
        $user = Auth::user();

        $practice->load(['material:id,material_name,created_by', 'questions.options', 'questions.items', 'questions.subTopicRef']);
        $isOwner = $practice->material && (int) $practice->material->created_by === (int) $user->id;
        abort_unless($isOwner || $user->role === 'superadmin', 403);

        $questions = $practice->questions
            ->sortBy('id')
            ->values()
            ->map(function (PracticeQuestionModel $q) use ($practice) {
                return [
                    'id' => $q->id,
                    'question_text' => $q->question_text,
                    'subtopic_id' => $q->subtopic_id,
                    'sub_topic_name' => $q->subTopicRef->name ?? null,
                    'material_id' => $practice->material_id,
                    'type' => $q->type ?? 'multiple_choice',
                    'points' => (int) ($q->points ?? 10),
                    'code_snippet' => $q->code_snippet,
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

        $subtopics = SubTopicModel::query()
            ->where('material_id', $practice->material_id)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn ($s) => ['id' => $s->id, 'name' => $s->name]);

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
            'subtopics' => $subtopics,
            'authUser' => $user,
        ]);
    }

    public function show(PracticeModel $practice)
    {
        $user = Auth::user();

        $practice->load(['material:id,material_name,created_by', 'questions.options', 'questions.items', 'questions.subTopicRef']);
        $isOwner = $practice->material && (int) $practice->material->created_by === (int) $user->id;
        abort_unless($isOwner || $user->role === 'superadmin', 403);

        $questions = $practice->questions
            ->sortBy('id')
            ->values()
            ->map(function (PracticeQuestionModel $q) {
                return [
                    'id' => $q->id,
                    'question_text' => $q->question_text,
                    'subtopic_id' => $q->subtopic_id,
                    'sub_topic_name' => $q->subTopicRef->name ?? null,
                    'type' => $q->type ?? 'multiple_choice',
                    'points' => (int) ($q->points ?? 10),
                    'code_snippet' => $q->code_snippet,
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

    public function store(Request $request)
    {
        $data = $request->validate([
            'material_id' => ['required', 'integer', 'exists:materials,id'],
            'type' => ['required', 'in:practice,pretest'],
            'level' => ['required_if:type,practice', 'nullable', 'in:easy,medium,hard'],
        ]);

        $type = $data['type'];
        $level = $type === 'pretest' ? 'easy' : $data['level'];

        $existsQuery = PracticeModel::query()
            ->where('material_id', $data['material_id'])
            ->where('type', $type);
        
        if ($type === 'practice') {
            $existsQuery->where('level', $data['level']);
        }

        if ($existsQuery->exists()) {
            return back()->withErrors([
                'type' => $type === 'pretest' 
                    ? 'Pre-test untuk materi ini sudah ada.' 
                    : 'Latihan untuk level ini pada materi tersebut sudah ada.',
            ]);
        }

        $practice = PracticeModel::create([
            'material_id' => $data['material_id'],
            'type' => $type,
            'level' => $level,
        ]);

        $routeName = Auth::user()->role === 'superadmin' ? 'superadmin.practices.edit' : 'dosen.practices.edit';

        return redirect()->route($routeName, $practice->id)
            ->with('success', 'Latihan soal berhasil dibuat.');
    }

    public function saveQuestions(Request $request, PracticeModel $practice)
    {
        $data = $request->validate([
            'questions' => ['required', 'array', 'min:1'],
            'questions.*.id' => ['nullable', 'integer'],
            'questions.*.question_text' => ['required', 'string'],
            'questions.*.type' => ['nullable', Rule::in(['multiple_choice', 'drag_drop'])],
            'questions.*.points' => ['nullable', 'integer', 'min:1', 'max:100'],
            'questions.*.code_snippet' => ['nullable', 'string'],
            'questions.*.feedback_correct' => ['nullable', 'string'],
            'questions.*.feedback_incorrect' => ['nullable', 'string'],
            'questions.*.subtopic_id' => [
                'nullable',
                'integer',
                Rule::exists('subtopics', 'id')->where(fn ($query) =>
                    $query->where('material_id', $practice->material_id)
                ),
            ],
            'questions.*.remove_image' => ['nullable', 'boolean'],
            'questions.*.image' => ['nullable', 'image', 'max:2048'],
            'questions.*.options' => ['required', 'array', 'min:2'],
            'questions.*.options.*.text' => ['required', 'string'],
            'questions.*.options.*.is_correct' => ['required', 'boolean'],
        ]);

        DB::transaction(function () use ($data, $practice, $request) {
            foreach ($data['questions'] as $index => $q) {
                $question = PracticeQuestionModel::updateOrCreate(
                    ['id' => $q['id'] ?? null],
                    [
                        'practices_id' => $practice->id,
                        'question_text' => $q['question_text'],
                        'type' => $q['type'] ?? 'multiple_choice',
                        'points' => $q['points'] ?? 10,
                        'subtopic_id' => $q['subtopic_id'] ?? null,
                        'feedback_correct' => $q['feedback_correct'] ?? null,
                        'feedback_incorrect' => $q['feedback_incorrect'] ?? null,
                        'code_snippet' => $q['code_snippet'] ?? null,
                    ]
                );

                $imageKey = "questions.$index.image";
                $removeImage = !empty($q['remove_image']);

                if ($removeImage && $question->image_path) {
                    Storage::disk('public')->delete($question->image_path);
                    $question->image_path = null;
                    $question->save();
                }

                if ($request->hasFile($imageKey)) {
                    if ($question->image_path) {
                        Storage::disk('public')->delete($question->image_path);
                    }

                    $dir = $practice->material_id ? "practices/{$practice->material_id}" : 'practices';
                    $question->image_path = $request->file($imageKey)->store($dir, 'public');
                    $question->save();
                }

                if (($q['type'] ?? 'multiple_choice') === 'drag_drop') {
                    $question->options()->delete();
                    $question->items()->delete();
                    foreach ($q['options'] as $idx => $opt) {
                        PracticeItemModel::create([
                            'practice_questions_id' => $question->id,
                            'item_text' => $opt['text'],
                            'order_number' => $idx + 1,
                        ]);
                    }
                } else {
                    $question->items()->delete();
                    $question->options()->delete();
                    foreach ($q['options'] as $opt) {
                        PracticeOptionModel::create([
                            'practice_questions_id' => $question->id,
                            'option_text' => $opt['text'],
                            'is_correct' => $opt['is_correct'] ? 1 : 0,
                        ]);
                    }
                }
            }
        });

        return back()->with('success', 'Saved');
    }

    public function destroy(PracticeModel $practice)
    {
        DB::transaction(function () use ($practice) {

            foreach ($practice->questions as $q) {
                $q->options()->delete();
                $q->items()->delete();
            }

            $practice->questions()->delete();
            $practice->delete();
        });

        return back()->with('success', 'Deleted');
    }


    private function resolveSubTopicId(int $materialId, ?string $subtopicName): ?int
    {
        if (empty($subtopicName)) {
            return null;
        }

        $subtopic = SubTopicModel::query()
            ->where('material_id', $materialId)
            ->where('name', $subtopicName)
            ->first(['id']);

        return $subtopic?->id;
    }
    
    public function uploadQuestionImage(Request $request, PracticeQuestionModel $question)
    {
        $user = Auth::user();

        $question->load('practice.material:id,created_by');

        $isOwner = $question->practice &&
            $question->practice->material &&
            (int) $question->practice->material->created_by === (int) $user->id;

        abort_unless($isOwner || $user->role === 'superadmin', 403);

        $request->validate([
            'image' => ['required', 'image', 'max:2048'],
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
}
