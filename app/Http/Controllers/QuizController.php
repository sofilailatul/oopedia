<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\QuizModel;
use App\Models\QuizAttemptModel;
use App\Models\UserQuizAnswerModel;
use App\Models\QuizQuestionsModel;
use App\Models\QuizOptionModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuizController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $classIds = $user->classes()->pluck('classes.id');

        $quizzes = QuizModel::whereIn('class_id', $classIds)
            ->orderByDesc('id')
            ->get();

        return response()->json($quizzes);
    }

    public function show($quiz)
    {
        $quiz = QuizModel::with(['creator'])->findOrFail($quiz);
        return response()->json($quiz);
    }

    public function questions($quiz)
    {
        $quiz = QuizModel::with(['questions.options'])->findOrFail($quiz);

        // include pivot points
        $questions = $quiz->questions->map(function ($q) {
            return [
                'id' => $q->id,
                'material_id' => $q->material_id,
                'quiz_text' => $q->quiz_text,
                'image_path' => $q->image_path,
                'feedback_correct' => $q->feedback_correct,
                'feedback_incorrect' => $q->feedback_incorrect,
                'points' => $q->pivot?->points ?? 1,
                'options' => $q->options,
            ];
        });

        return response()->json([
            'quiz' => $quiz->only(['id','title','duration','passing_score','start_at','end_at','class_id']),
            'questions' => $questions,
        ]);
    }

    // ===== Mahasiswa: attempts =====
    public function startAttempt(Request $request, $quiz)
    {
        $quiz = QuizModel::findOrFail($quiz);

        $attempt = QuizAttemptModel::create([
            'user_id' => $request->user()->id,
            'quizzes_id' => $quiz->id,
            'started_at' => now(),
        ]);

        return response()->json($attempt, 201);
    }

    /**
     * Body:
     * { "answers":[ {"quiz_questions_id":1, "quiz_options_id":2}, ... ] }
     */
    public function submitAnswers(Request $request, $attempt)
    {
        $attempt = QuizAttemptModel::findOrFail($attempt);

        if ($attempt->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'answers' => ['required','array','min:1'],
            'answers.*.quiz_questions_id' => ['required','integer','exists:quiz_questions,id'],
            'answers.*.quiz_options_id' => ['required','integer','exists:quiz_options,id'],
        ]);

        $saved = [];

        DB::transaction(function () use ($data, $attempt, &$saved) {
            foreach ($data['answers'] as $ans) {
                $opt = QuizOptionModel::findOrFail($ans['quiz_options_id']);

                $saved[] = UserQuizAnswerModel::updateOrCreate(
                    [
                        'quiz_attempts_id' => $attempt->id,
                        'quiz_questions_id' => $ans['quiz_questions_id'],
                    ],
                    [
                        'quiz_options_id' => $ans['quiz_options_id'],
                        'is_correct' => (bool) $opt->is_correct,
                    ]
                );
            }
        });

        return response()->json(['message' => 'answers_saved', 'answers' => $saved]);
    }

    public function finishAttempt(Request $request, $attempt)
    {
        $attempt = QuizAttemptModel::with(['quiz.questions', 'answers'])->findOrFail($attempt);

        if ($attempt->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $quiz = QuizModel::with('questions')->findOrFail($attempt->quizzes_id);

        $pointsByQ = $quiz->questions->pluck('pivot.points', 'id'); 

        $score = 0;
        foreach ($attempt->answers as $ans) {
            if ($ans->is_correct) {
                $score += (int) ($pointsByQ[$ans->quiz_questions_id] ?? 1);
            }
        }

        $attempt->update([
            'finished_at' => now(),
            'total_score' => $score,
        ]);

        $this->updateCompletedQuizAt($request->user()->id, $attempt->quizzes_id);
        DB::commit();

        return response()->json($attempt);
    }

    private function updateCompletedQuizAt(int $userId, int $quizId): void
    {
        // 1. Ambil class_id
        $classId = DB::table('class_user')
            ->where('user_id', $userId)
            ->value('class_id');
        
        // 2. Ambil material_ids dari quiz
        $materialIds = QuizMapModel::query()
            ->join('quiz_questions', 'quiz_questions.id', '=', 'quiz_map.quiz_question_id')
            ->where('quiz_map.quiz_id', $quizId)
            ->pluck('quiz_questions.material_id')
            ->unique();
        
        // 3. Update completed_quiz_at
        UserProgressModel::query()
            ->where('user_id', $userId)
            ->where('class_id', $classId)
            ->whereIn('material_id', $materialIds)
            ->update(['completed_quiz_at' => now()]);
    }

    public function attemptDetail(Request $request, $attempt)
    {
        $attempt = QuizAttemptModel::with([
            'quiz',
            'answers.question.options',
        ])->findOrFail($attempt);

        if ($attempt->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json($attempt);
    }

    // ===== DOSEN: CRUD Quiz =====
    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => ['required','string','max:255'],
            'class_id' => ['required','integer','exists:classes,id'],
            'duration' => ['required','integer','min:1'],
            'passing_score' => ['nullable','integer','min:0','max:100'],
            'start_at' => ['nullable','date'],
            'end_at' => ['nullable','date','after_or_equal:start_at'],
        ]);

        $quiz = QuizModel::create([
            ...$data,
            'created_by' => $request->user()->id,
            'passing_score' => $data['passing_score'] ?? 60,
        ]);

        return response()->json($quiz, 201);
    }

    public function update(Request $request, $quiz)
    {
        $quiz = QuizModel::findOrFail($quiz);

        $data = $request->validate([
            'title' => ['sometimes','required','string','max:255'],
            'class_id' => ['sometimes','required','integer','exists:classes,id'],
            'duration' => ['sometimes','required','integer','min:1'],
            'passing_score' => ['sometimes','nullable','integer','min:0','max:100'],
            'start_at' => ['sometimes','nullable','date'],
            'end_at' => ['sometimes','nullable','date','after_or_equal:start_at'],
        ]);

        $quiz->update($data);

        return response()->json($quiz);
    }

    public function destroy($quiz)
    {
        $quiz = QuizModel::findOrFail($quiz);
        $quiz->delete();

        return response()->json(['message' => 'deleted']);
    }

    // ===== DOSEN: bank soal =====
    public function questionStore(Request $request)
    {
        $data = $request->validate([
            'material_id' => ['required','integer','exists:materials,id'],
            'quiz_text' => ['required','string'],
            'image_path' => ['nullable','string','max:255'],
            'feedback_correct' => ['nullable','string'],
            'feedback_incorrect' => ['nullable','string'],
        ]);

        $q = QuizQuestionsModel::create($data);

        return response()->json($q, 201);
    }

    public function questionUpdate(Request $request, $question)
    {
        $q = QuizQuestionsModel::findOrFail($question);

        $data = $request->validate([
            'material_id' => ['sometimes','required','integer','exists:materials,id'],
            'quiz_text' => ['sometimes','required','string'],
            'image_path' => ['sometimes','nullable','string','max:255'],
            'feedback_correct' => ['sometimes','nullable','string'],
            'feedback_incorrect' => ['sometimes','nullable','string'],
        ]);

        $q->update($data);

        return response()->json($q);
    }

    public function questionDestroy($question)
    {
        $q = QuizQuestionsModel::findOrFail($question);
        $q->delete();

        return response()->json(['message' => 'deleted']);
    }

    public function uploadQuestionImage(Request $request, $question)
    {
        return response()->json(['message' => 'TODO: implement upload based on your storage setup'], 501);
    }

    public function deleteQuestionImage(Request $request, $question)
    {
        return response()->json(['message' => 'TODO: implement delete based on your storage setup'], 501);
    }

    // ===== DOSEN: quiz_map + points =====
    public function mapAttach(Request $request, $quiz)
    {
        $quiz = QuizModel::findOrFail($quiz);

        $data = $request->validate([
            'quiz_question_id' => ['required','integer','exists:quiz_questions,id'],
            'points' => ['nullable','integer','min:0'],
        ]);

        $quiz->questions()->syncWithoutDetaching([
            $data['quiz_question_id'] => ['points' => $data['points'] ?? 1],
        ]);

        return response()->json(['message' => 'attached']);
    }

    public function mapUpdate(Request $request, $quiz, $question)
    {
        $quiz = QuizModel::findOrFail($quiz);

        $data = $request->validate([
            'points' => ['required','integer','min:0'],
        ]);

        $quiz->questions()->updateExistingPivot($question, ['points' => $data['points']]);

        return response()->json(['message' => 'updated']);
    }

    public function mapDetach($quiz, $question)
    {
        $quiz = QuizModel::findOrFail($quiz);
        $quiz->questions()->detach($question);

        return response()->json(['message' => 'detached']);
    }
}
