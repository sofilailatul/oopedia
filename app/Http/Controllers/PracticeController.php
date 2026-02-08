<?php

namespace App\Http\Controllers;

use App\Services\PracticeService;
use App\Models\PracticeAttemptModel;
use App\Models\PracticeModel;
use App\Models\PracticeQuestionModel;
use App\Models\UserPracticeAnswerModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
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
