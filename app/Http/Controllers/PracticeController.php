<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\MaterialModel;
use App\Models\PracticeModel;
use App\Models\PracticeAttemptModel;
use App\Models\UserPracticeAnswerModel;
use App\Models\PracticeQuestionModel;
use App\Models\PracticeOptionModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PracticeController extends Controller
{
    public function index()
    {
        $practices = PracticeModel::with([
                'material:id,material_name',
            ])
            ->withCount('questions')
            ->orderBy('id')
            ->get();

        return response()->json($practices);
    }

    public function byMaterial($material)
    {
        $material = MaterialModel::findOrFail($material);

        $practices = PracticeModel::where('material_id', $material->id)
            ->withCount('questions')
            ->orderBy('id')
            ->get();

        return response()->json($practices);
    }

    // public function show($practice)
    // {
    //     $practice = PracticeModel::with([
    //         'material',
    //         'questions.options',
    //         'questions.items',
    //     ])->findOrFail($practice);

    //     return response()->json($practice);
    // }

    public function summary(Request $request, $practice)
    {
        $user = $request->user();

        $practice = PracticeModel::with([
                'material:id,material_name,description,order_number',
            ])
            ->withCount([
                'questions as total_questions' => fn ($q) => $q,
                'questions as mc_count' => fn ($q) => $q->where('type', 'multiple_choice'),
                'questions as drag_count' => fn ($q) => $q->where('type', 'drag_drop'),
            ])
            ->findOrFail($practice);

        $materialId = $practice->material_id;

        // ambil practice easy/normal/hard untuk material yang sama
        $practiceByDifficulty = PracticeModel::where('material_id', $materialId)
            ->get()
            ->keyBy('difficulty_level'); // ['easy' => ..., 'normal' => ..., 'hard' => ...]

        $normalPractice = $practiceByDifficulty->get('normal');
        $easyPractice   = $practiceByDifficulty->get('easy');
        $hardPractice   = $practiceByDifficulty->get('hard');

        // nilai normal sebagai acuan unlock
        $normalScore = null;
        if ($normalPractice) {
            $normalAttempt = PracticeAttemptModel::where('user_id', $user->id)
                ->where('practices_id', $normalPractice->id)
                ->whereNotNull('finished_at')
                ->latest('id')
                ->first();

            $normalScore = $normalAttempt?->final_score;
        }

        $unlockHard = $normalScore !== null && $normalScore >= 80;
        $unlockEasy = $normalScore !== null && $normalScore < 60;

        // attempt terakhir untuk practice yang sedang dibuka (buat status sidebar)
        $lastAttempt = PracticeAttemptModel::where('user_id', $user->id)
            ->where('practices_id', $practice->id)
            ->latest('id')
            ->first();

        $status = 'not_started';
        if ($lastAttempt) $status = $lastAttempt->finished_at ? 'done' : 'progress';

        return response()->json([
            'practice' => [
                'id' => $practice->id,
                'material_id' => $practice->material_id,
                'material_name' => $practice->material->material_name ?? null,
                'description' => $practice->material->description ?? null,
                'difficulty_level' => $practice->difficulty_level,
                'duration_minutes' => $practice->duration_minutes ?? 90,
                'types' => [
                    ['key' => 'multiple_choice', 'label' => 'Multiple Choice', 'count' => (int)$practice->mc_count],
                    ['key' => 'drag_drop', 'label' => 'Drag & Drop', 'count' => (int)$practice->drag_count],
                ],
                'total_questions' => (int)$practice->total_questions,
            ],
            'attempt' => $lastAttempt ? [
                'id' => $lastAttempt->id,
                'status' => $status,
                'final_score' => $lastAttempt->final_score,
                'finished_at' => $lastAttempt->finished_at,
            ] : [
                'status' => $status,
            ],
            'difficulty' => [
                'default' => 'normal',
                'normal_score' => $normalScore,
                'options' => [
                    [
                        'key' => 'easy',
                        'label' => 'Easy',
                        'practice_id' => $easyPractice?->id,
                        'enabled' => (bool) $easyPractice && $unlockEasy,
                        'reason' => $unlockEasy ? 'Nilai normal < 60' : 'Easy muncul jika nilai normal < 60',
                    ],
                    [
                        'key' => 'normal',
                        'label' => 'Normal',
                        'practice_id' => $normalPractice?->id,
                        'enabled' => (bool) $normalPractice,
                        'reason' => 'Default',
                    ],
                    [
                        'key' => 'hard',
                        'label' => 'Hard',
                        'practice_id' => $hardPractice?->id,
                        'enabled' => (bool) $hardPractice && $unlockHard,
                        'reason' => $unlockHard ? 'Nilai normal >= 80' : 'Nilai normal harus >= 80',
                    ],
                ],
            ],
        ]);
    }   

    // DOSEN/SUPERADMIN
    public function store(Request $request)
    {
        $data = $request->validate([
            'material_id' => ['required','integer','exists:materials,id'],
            'difficulty_level' => ['required','in:easy,normal,hard'],
        ]);

        $practice = PracticeModel::create($data);

        return response()->json($practice, 201);
    }

    public function update(Request $request, $practice)
    {
        $practice = PracticeModel::findOrFail($practice);

        $data = $request->validate([
            'material_id' => ['sometimes','required','integer','exists:materials,id'],
            'difficulty_level' => ['sometimes','required','in:easy,normal,hard'],
        ]);

        $practice->update($data);

        return response()->json($practice);
    }

    public function destroy($practice)
    {
        $practice = PracticeModel::findOrFail($practice);
        $practice->delete();

        return response()->json(['message' => 'deleted']);
    }

    // ===== Mahasiswa: attempts =====
    public function startAttempt(Request $request, $practice)
    {
        $practice = PracticeModel::findOrFail($practice);

        $attempt = PracticeAttemptModel::create([
            'user_id' => $request->user()->id,
            'practices_id' => $practice->id,
            'started_at' => now(),
        ]);

        return response()->json($attempt, 201);
    }
    
    public function submitAnswers(Request $request, $attempt)
    {
        $attempt = PracticeAttemptModel::with('practice.questions')->findOrFail($attempt);

        if ($attempt->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'answers' => ['required','array','min:1'],
            'answers.*.practice_questions_id' => ['required','integer','exists:practice_questions,id'],
            'answers.*.practice_options_id' => ['nullable','integer','exists:practice_options,id'],
            'answers.*.selection_items' => ['nullable','array'],
            'answers.*.is_correct' => ['nullable','boolean'], // untuk drag_drop (kalau FE yang ngecek)
            'answers.*.timespent' => ['nullable','integer'],
        ]);

        $saved = [];

        DB::transaction(function () use ($data, $attempt, &$saved) {
            foreach ($data['answers'] as $ans) {
                $question = PracticeQuestionModel::findOrFail($ans['practice_questions_id']);

                $isCorrect = false;
                $score = 0;

                if ($question->type === 'multiple_choice') {
                    if (!empty($ans['practice_options_id'])) {
                        $opt = PracticeOptionModel::findOrFail($ans['practice_options_id']);
                        $isCorrect = (bool) $opt->is_correct;
                        $score = $isCorrect ? 1 : 0;
                    }
                } else {
                    // drag_drop:
                    // di schema kamu belum ada "kunci jawaban" drag-drop,
                    // jadi opsi paling aman: terima dari FE (ans.is_correct) atau default false
                    $isCorrect = (bool) ($ans['is_correct'] ?? false);
                    $score = $isCorrect ? 1 : 0;
                }

                $saved[] = UserPracticeAnswerModel::updateOrCreate(
                    [
                        'practice_attempts_id' => $attempt->id,
                        'practice_questions_id' => $question->id,
                        'attempt' => 1,
                    ],
                    [
                        'practice_options_id' => $ans['practice_options_id'] ?? null,
                        'selection_items' => isset($ans['selection_items']) ? json_encode($ans['selection_items']) : null,
                        'is_correct' => $isCorrect,
                        'score' => $score,
                        'timespent' => $ans['timespent'] ?? null,
                    ]
                );
            }
        });

        return response()->json([
            'message' => 'answers_saved',
            'answers' => $saved,
        ]);
    }

    public function finishAttempt(Request $request, $attempt)
    {
        $attempt = PracticeAttemptModel::with(['practice.questions', 'answers.question'])->findOrFail($attempt);

        if ($attempt->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $questions = $attempt->practice?->questions ?? collect();
        $totalQ = max(1, $questions->count());

        $mcCorrect = 0;
        $dragCorrect = 0;

        foreach ($attempt->answers as $ans) {
            $type = $ans->question?->type;
            if ($type === 'multiple_choice' && $ans->is_correct) $mcCorrect++;
            if ($type === 'drag_drop' && $ans->is_correct) $dragCorrect++;
        }

        $totalCorrect = $mcCorrect + $dragCorrect;
        $finalScore = (int) round(($totalCorrect / $totalQ) * 100);

        $attempt->update([
            'finished_at' => now(),
            'mc_correct' => $mcCorrect,
            'drag_correct' => $dragCorrect,
            'total_earned' => $totalCorrect,
            'final_score' => $finalScore,
            'is_passed' => $finalScore >= 60,
        ]);

        return response()->json($attempt);
    }

    public function attemptDetail(Request $request, $attempt)
    {
        $attempt = PracticeAttemptModel::with([
            'practice.material',
            'answers.question.options',
            'answers.question.items',
        ])->findOrFail($attempt);

        if ($attempt->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json($attempt);
    }

    // upload/delete image question: route ada, tapi implement file upload tergantung storage kamu.
    public function uploadQuestionImage(Request $request, $question)
    {
        return response()->json(['message' => 'TODO: implement upload based on your storage setup'], 501);
    }

    public function deleteQuestionImage(Request $request, $question)
    {
        return response()->json(['message' => 'TODO: implement delete based on your storage setup'], 501);
    }
}
