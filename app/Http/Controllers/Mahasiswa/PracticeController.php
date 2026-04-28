<?php

namespace App\Http\Controllers\Mahasiswa;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\MaterialModel;
use App\Models\UserProgressModel;
use App\Models\PracticeModel;
use App\Models\PracticeAttemptModel;
use App\Models\PracticeQuestionModel;
use App\Models\SubTopicModel;
use App\Models\UserPracticeAnswerModel;
use App\Services\LearningPathService;
use App\Services\PracticeService;

class PracticeController extends Controller
{
    protected $practiceService;
    protected $learningPathService;

    public function __construct(PracticeService $practiceService, LearningPathService $learningPathService)
    {
        $this->practiceService = $practiceService;
        $this->learningPathService = $learningPathService;
    }

    public function index()
    {
        $userId = Auth::id();
        $practices = $this->practiceService->getPracticesForUser($userId);

        return Inertia::render('Practices/Index', [
            'practices' => $practices,
        ]);
    }

    public function entry(MaterialModel $material)
    {
        $user = Auth::user();

        $progress = UserProgressModel::firstOrCreate(
            [
                'user_id'     => $user->id,
                'material_id' => $material->id,
            ],
            [
                'status'        => 'in_progress',
                'current_mode'  => 'pretest',
                'current_level' => null,
            ]
        );

        // ── PRETEST ───────────────────────────────────────────────────────────
        if ($progress->current_mode === 'pretest' || is_null($progress->completed_pretest_at)) {
            $pretestPractice = $this->practiceService->getPretestPracticeByMaterial($material->id);
            abort_unless($pretestPractice, 404, 'Pretest untuk materi ini belum tersedia.');

            // Cegah duplikat attempt yang belum selesai
            $unfinishedAttempt = PracticeAttemptModel::query()
                ->where('user_id', $user->id)
                ->where('practices_id', $pretestPractice->id)
                ->whereNull('finished_at')
                ->latest()
                ->first();

            if ($unfinishedAttempt) {
                return redirect()->route('practices.attempts.show', $unfinishedAttempt->id);
            }

            $attempt = PracticeAttemptModel::create([
                'user_id'          => $user->id,
                'practices_id'     => $pretestPractice->id,
                'user_progress_id' => $progress->id,
                'attempt_type'     => 'pretest',
                'level'            => null,
                'mode'             => null,
                'attempt_number'   => $this->nextAttemptNumber($user->id, $pretestPractice->id),
                'started_at'       => now(),
            ]);

            return redirect()->route('practices.attempts.show', $attempt->id);
        }

        // ── SUDAH LULUS ───────────────────────────────────────────────────────
        if ($progress->current_mode === 'passed') {
            return redirect()->route('materials.show', $material->id)
                ->with('info', 'Latihan untuk materi ini sudah selesai.');
        }

        // ── PERLU BACA ULANG MATERI ───────────────────────────────────────────
        if ($progress->current_mode === 'repeat_material') {
            return redirect()->route('materials.show', $material->id)
                ->with('info', 'Kamu perlu membaca ulang materi sebelum melanjutkan latihan.');
        }

        // ── LATIHAN NORMAL / FOCUSED REMEDIAL ─────────────────────────────────
        if (in_array($progress->current_mode, ['normal', 'focused_remedial'], true) && !empty($progress->current_level)) {

            $practice = $this->resolvePractice($material->id, $progress->current_level);

            abort_unless(
                $practice,
                404,
                'Latihan untuk level ' . strtoupper($progress->current_level) . ' belum tersedia. Hubungi dosen.'
            );

            // Cegah duplikat attempt yang belum selesai
            $unfinishedAttempt = PracticeAttemptModel::query()
                ->where('user_id', $user->id)
                ->where('practices_id', $practice->id)
                ->where('level', $progress->current_level)
                ->where('mode', $progress->current_mode)
                ->whereNull('finished_at')
                ->latest()
                ->first();

            if ($unfinishedAttempt) {
                return redirect()->route('practices.attempts.show', $unfinishedAttempt->id)
                    ->with('info', 'Melanjutkan sesi latihan yang belum selesai.');
            }

            $attempt = PracticeAttemptModel::create([
                'user_id'             => $user->id,
                'practices_id'        => $practice->id,
                'user_progress_id'    => $progress->id,
                'focused_subtopic_id' => $progress->focused_subtopic_id,
                'focused_subtopic_ids' => $progress->focused_subtopic_ids,
                'attempt_type'        => 'practice',
                'level'               => $progress->current_level,
                'mode'                => $progress->current_mode,
                'attempt_number'      => $this->nextAttemptNumber($user->id, $practice->id),
                'next_action'         => $progress->next_action,
                'started_at'          => now(),
            ]);

            return redirect()->route('practices.attempts.show', $attempt->id)
                ->with('info', 'Mulai latihan level ' . strtoupper($progress->current_level) . '.');
        }

        return redirect()->route('practices.index')
            ->with('info', 'Status belajar belum siap untuk memulai latihan.');
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

    public function attemptDetail(PracticeAttemptModel $attempt)
    {
        abort_unless($attempt->user_id === Auth::id(), 403);

        $attempt->load(['practice.material']);

        $cfg = $this->buildAttemptConfig($attempt, $attempt->practice);

        if ($attempt->mode === 'focused_remedial' && empty($cfg['focused_subtopic_id']) && empty($cfg['focused_subtopic_ids'])) {
            return redirect()->back()->with('error', 'Subtopik lemah belum terdeteksi. Silakan hubungi dosen Anda.');
        }

        $questions = $this->resolveAttemptQuestions($attempt, $cfg);

        if ($questions->isEmpty() && !empty($cfg['weak_subtopic_id']) && $attempt->mode === 'focused_remedial') {
            return redirect()->back()->with('error', 'Tidak ada soal remedial untuk subtopik ini. Silakan hubungi dosen Anda.');
        }

        return Inertia::render('Practices/AttemptShow', [
            'attempt'     => $attempt,
            'questions'   => $questions,
            'cfg'         => $cfg,
            'attemptType' => $attempt->attempt_type,
        ]);
    }
    
    private function resolveAttemptQuestions(PracticeAttemptModel $attempt, array $cfg)
    {
        $questionCount = (int) ($cfg['question_count'] ?? 10);

        // ── FOCUSED REMEDIAL: fokus ke subtopik lemah (bisa lebih dari 1) ──────────
        $subtopicIds = [];
        if (!empty($cfg['focused_subtopic_ids'])) {
            $subtopicIds = is_string($cfg['focused_subtopic_ids']) 
                ? json_decode($cfg['focused_subtopic_ids'], true) 
                : $cfg['focused_subtopic_ids'];
        } elseif (!empty($cfg['focused_subtopic_id'])) {
            $subtopicIds = [$cfg['focused_subtopic_id']];
        }

        if ($attempt->mode === 'focused_remedial' && !empty($subtopicIds)) {
            $questionsQuery = PracticeQuestionModel::query()
                ->where('practices_id', $attempt->practices_id)
                ->whereIn('subtopic_id', $subtopicIds)
                ->with(['options', 'items']);

            // Exclude soal yang sudah pernah dikerjakan user di practice ini
            $answeredQuestionIds = UserPracticeAnswerModel::query()
                ->whereHas('attempt', function ($q) use ($attempt) {
                    $q->where('user_id', $attempt->user_id)
                    ->where('practices_id', $attempt->practices_id);
                })
                ->pluck('practice_questions_id')
                ->toArray();

            if (!empty($answeredQuestionIds)) {
                $questionsQuery->whereNotIn('id', $answeredQuestionIds);
            }

            $questions = $questionsQuery
                ->inRandomOrder()
                ->limit($questionCount)
                ->get();

            // fallback: recycle soal salah
            if ($questions->isEmpty()) {
                $wrongQuestionIds = UserPracticeAnswerModel::query()
                    ->where('is_correct', 0)
                    ->whereHas('attempt', function ($q) use ($attempt) {
                        $q->where('user_id', $attempt->user_id)
                        ->where('practices_id', $attempt->practices_id);
                    })
                    ->whereHas('question', function ($q) use ($subtopicIds) {
                        $q->whereIn('subtopic_id', $subtopicIds);
                    })
                    ->pluck('practice_questions_id')
                    ->toArray();

                $questions = PracticeQuestionModel::query()
                    ->where('practices_id', $attempt->practices_id)
                    ->whereIn('subtopic_id', $subtopicIds)
                    ->whereIn('id', $wrongQuestionIds)
                    ->with(['options', 'items'])
                    ->inRandomOrder()
                    ->limit($questionCount)
                    ->get();
            }

            return $questions;
        }

        // ── NORMAL / PRETEST / mode lain: total 10, setiap subtopik terwakili ──
        $allQuestions = PracticeQuestionModel::query()
            ->where('practices_id', $attempt->practices_id)
            ->with(['options', 'items'])
            ->get();

        if ($allQuestions->isEmpty()) {
            return collect();
        }

        // Group by subtopic
        $groupedBySubtopic = $allQuestions->groupBy(function ($q) {
            return $q->subtopic_id ?? 'no_subtopic';
        });

        $selected = collect();

        // Ambil 1 random per subtopik dulu
        $subtopicGroups = $groupedBySubtopic->shuffle();

        foreach ($subtopicGroups as $subtopicId => $items) {
            if ($selected->count() >= $questionCount) {
                break;
            }

            $picked = $items->shuffle()->first();
            if ($picked) {
                $selected->push($picked);
            }
        }

        // Kalau belum genap 10, isi dari sisa soal yang belum terambil
        if ($selected->count() < $questionCount) {
            $selectedIds = $selected->pluck('id')->all();

            $remainingPool = $allQuestions
                ->whereNotIn('id', $selectedIds)
                ->shuffle()
                ->take($questionCount - $selected->count());

            $selected = $selected->concat($remainingPool);
        }

        // Final shuffle supaya urutan soal tidak per subtopik
        return $selected->shuffle()->values();
    }

    public function submitAnswers(Request $request, PracticeAttemptModel $attempt)
    {
        abort_unless($attempt->user_id === Auth::id(), 403);

        if (!is_null($attempt->finished_at)) {
            return redirect()->route('practices.summary', $attempt->practices_id)
                ->with('info', 'Attempt ini sudah disubmit sebelumnya.');
        }

        $data = $request->validate([
            'answers'                     => ['required', 'array'],
            'question_ids'                => ['required', 'array', 'min:1'],
            'question_ids.*'              => ['integer'],
            'answers.*.type'              => ['required', 'in:multiple_choice,drag_drop'],
            'answers.*.timespent'         => ['nullable', 'integer', 'min:0'],
            'answers.*.option_id'         => ['nullable', 'integer'],
            'answers.*.selection_items'   => ['nullable', 'array'],
            'answers.*.selection_items.*' => ['string'],
        ]);

        DB::transaction(function () use ($attempt, $data) {
            $questionIds = array_map('intval', $data['question_ids']);

            $questions = PracticeQuestionModel::query()
                ->whereIn('id', $questionIds)
                ->with(['options', 'items'])
                ->get()
                ->keyBy('id');

            foreach ($questionIds as $qid) {
                $answer   = $data['answers'][(string) $qid] ?? $data['answers'][$qid] ?? null;
                $question = $questions->get($qid);

                if (!$question) {
                    continue;
                }

                if (!$answer || !isset($answer['type'])) {
                    UserPracticeAnswerModel::updateOrCreate(
                        [
                            'practice_attempts_id'  => $attempt->id,
                            'practice_questions_id' => $qid,
                        ],
                        [
                            'practice_options_id' => null,
                            'selection_items'     => null,
                            'is_correct'          => 0,
                            'score'               => 0,
                            'timespent'           => null,
                        ]
                    );
                    continue;
                }

                $isCorrect = false;
                $score = 0;
                $questionPoints = (int) ($question->points ?? 10);

                if ($answer['type'] === 'multiple_choice') {
                    $optionId = isset($answer['option_id']) ? (int) $answer['option_id'] : null;

                    $correctOpt = $question->options->first(function ($opt) {
                        return (int) $opt->is_correct === 1
                            || $opt->is_correct === true
                            || $opt->is_correct === '1';
                    });

                    $isCorrect = $correctOpt && $optionId && ((int) $correctOpt->id === $optionId);
                    $score = $isCorrect ? $questionPoints : 0;

                    UserPracticeAnswerModel::updateOrCreate(
                        [
                            'practice_attempts_id'  => $attempt->id,
                            'practice_questions_id' => $qid,
                        ],
                        [
                            'practice_options_id' => $optionId,
                            'is_correct'          => $isCorrect ? 1 : 0,
                            'score'               => $score,
                            'timespent'           => (int) ($answer['timespent'] ?? 0),
                            'selection_items'     => null,
                        ]
                    );
                } else {
                    $selectionItems = array_values(array_map(
                        fn ($item) => trim((string) $item),
                        $answer['selection_items'] ?? []
                    ));

                    $correctOrder = $question->items
                        ->sortBy('id')
                        ->pluck('item_text')
                        ->map(fn ($item) => trim((string) $item))
                        ->values()
                        ->all();

                    $isCorrect = ($selectionItems === $correctOrder);
                    $score = $isCorrect ? $questionPoints : 0;

                    UserPracticeAnswerModel::updateOrCreate(
                        [
                            'practice_attempts_id'  => $attempt->id,
                            'practice_questions_id' => $qid,
                        ],
                        [
                            'selection_items'     => $selectionItems,
                            'practice_options_id' => null,
                            'is_correct'          => $isCorrect ? 1 : 0,
                            'score'               => $score,
                            'timespent'           => (int) ($answer['timespent'] ?? 0),
                        ]
                    );
                }
            }

            $score = $this->learningPathService->calculateScore($attempt->id);
            $progress = UserProgressModel::query()->findOrFail($attempt->user_progress_id);
            
            // Calculate resolved weak subtopics (merging current list with attempt results)
            $weakIds = $this->learningPathService->calculateUpdatedWeakSubtopics($progress, $attempt->id);
            
            $passingThreshold = $attempt->level === 'hard' ? 80 : 60;
            $isPassed = $score >= $passingThreshold;

            $resolvedSubtopicId = $weakIds[0] ?? null;
            $resolvedSubtopicIds = count($weakIds) > 0 ? json_encode($weakIds) : null;

            $attempt->update([
                'final_score'         => $score,
                'focused_subtopic_id' => $resolvedSubtopicId,
                'focused_subtopic_ids'=> $resolvedSubtopicIds,
                'is_passed'           => $isPassed ? 1 : 0,
                'finished_at'         => now(),
            ]);

            if ($attempt->attempt_type === 'pretest') {
                $updatedProgress = $this->learningPathService->handlePretest(
                    $progress,
                    $score,
                    $weakIds
                );
            } else {
                $updatedProgress = $this->learningPathService->handlePractice(
                    $progress,
                    $attempt
                );
            }

            $attempt->update([
                'next_action'         => $updatedProgress->next_action,
                'focused_subtopic_id' => $updatedProgress->focused_subtopic_id ?? $resolvedSubtopicId,
                'focused_subtopic_ids'=> $updatedProgress->focused_subtopic_ids ?? $resolvedSubtopicIds,
            ]);
        });

        return redirect()->route('practices.summary', $attempt->practices_id)
            ->with('success', 'Jawaban berhasil dikumpulkan.');
    }

    public function summary(PracticeModel $practice)
    {
        $userId = Auth::id();
        $mode = request()->query('mode');

        $attemptQuery = PracticeAttemptModel::query()
            ->where('user_id', $userId)
            ->where('practices_id', $practice->id)
            ->whereNotNull('finished_at');

        if (in_array($mode, ['normal', 'focused_remedial'], true)) {
            $attemptQuery->where('mode', $mode);
        }

        $attempt = $attemptQuery
            ->latest('finished_at')
            ->first();

        abort_unless($attempt, 404);

        $answers = UserPracticeAnswerModel::query()
            ->where('practice_attempts_id', $attempt->id)
            ->with([
                'question.options',
                'question.items',
                'question.subTopicRef',
                'option',
            ])
            ->get();

        $subtopicIds = $answers
            ->map(fn ($answer) => $answer->question?->subtopic_id)
            ->filter()
            ->unique()
            ->values();

        $subtopicNames = $subtopicIds->isEmpty()
            ? collect()
            : SubTopicModel::query()
                ->whereIn('id', $subtopicIds)
                ->pluck('name', 'id');

        foreach ($answers as $answer) {
            $question = $answer->question;

            if (!$question) {
                continue;
            }

            $subtopicId = $question->subtopic_id;

            $subtopicName =
                $question->subTopicRef?->name
                ?? ($subtopicId ? $subtopicNames->get($subtopicId) : null);

            $question->setAttribute('subtopic_id', $subtopicId);
            $question->setAttribute('sub_topic_id', $subtopicId);
            $question->setAttribute('subtopic_name', $subtopicName);
            $question->setAttribute('sub_topic_name', $subtopicName);
        }

        $cfg = $this->buildAttemptConfig($attempt, $practice);

        $progress = UserProgressModel::query()
            ->where('user_id', $userId)
            ->where('material_id', $practice->material_id)
            ->first();

        $nextLevel = $this->nextLevelFromProgress($progress, $attempt);

        return Inertia::render('Practices/Summary', [
            'practice'  => $practice->loadMissing('material'),
            'attempt'   => $attempt,
            'answers'   => $answers,
            'cfg'       => $cfg,
            'nextLevel' => $nextLevel,
        ]);
    }

    // ── PRIVATE HELPERS ───────────────────────────────────────────────────────

    /**
     * Resolve practice berdasarkan level progress mahasiswa.
     * Sesuaikan $dbLevelMap jika DB kamu pakai nama berbeda (misal 'normal' untuk medium).
     */
    private function resolvePractice(int $materialId, string $level): ?PracticeModel
    {
        return PracticeModel::query()
            ->where('material_id', $materialId)
            ->where('type', 'practice')
            ->where('level', $level)
            ->first();
    }

    /**
     * Hitung attempt_number berikutnya untuk user + practice tertentu.
     */
    private function nextAttemptNumber(int $userId, int $practiceId): int
    {
        return PracticeAttemptModel::query()
            ->where('user_id', $userId)
            ->where('practices_id', $practiceId)
            ->count() + 1;
    }

    /**
    * Build config array untuk AttemptShow dan Summary.
     */
    private function buildAttemptConfig(PracticeAttemptModel $attempt, ?PracticeModel $practice = null): array
    {
        $practiceLevel          = $practice?->level;
        $resolvedLevel          = $attempt->level ?? $practiceLevel;

        return [
            'mode'             => $attempt->attempt_type === 'pretest'
                                    ? 'pretest'
                                    : ($attempt->mode ?? 'normal'),
            'question_type'    => 'mixed',
            'question_count'   => (int) ($attempt->total_questions ?? 10),
            'duration_seconds' => (int) ($attempt->duration_seconds ?? 15 * 60),
            'level'            => $resolvedLevel,
            'focused_subtopic_id' => $attempt->focused_subtopic_id,
            'focused_subtopic_ids' => $attempt->focused_subtopic_ids,
            'remediation_round'=> (int) ($attempt->remediation_round ?? 0),
        ];
    }

    /**
     * Derive data arahan berikutnya untuk halaman Summary.
     * Mapping next_action (backend) → action (frontend Summary.jsx).
     */
    private function nextLevelFromProgress(?UserProgressModel $progress, ?PracticeAttemptModel $attempt = null): array
    {
        if (!$progress) {
            return [
                'next_level'           => null,
                'message'              => 'Data progress belum tersedia.',
                'action'               => 'default',
                'mode'                 => 'regular',
                'focused_subtopic_id'  => null,
                'weak_subtopic_name'   => null,
                'remediation_round'    => 0,
                'recommend_review'     => false,
            ];
        }

        $weakSubtopicIds = [];
        if (!empty($progress->focused_subtopic_ids)) {
            $weakSubtopicIds = is_string($progress->focused_subtopic_ids) 
                ? json_decode($progress->focused_subtopic_ids, true) 
                : $progress->focused_subtopic_ids;
        } elseif (!empty($progress->focused_subtopic_id)) {
            $weakSubtopicIds = [$progress->focused_subtopic_id];
        }

        $weakSubtopicNames = [];
        if (!empty($weakSubtopicIds)) {
            $weakSubtopicNames = SubTopicModel::whereIn('id', $weakSubtopicIds)->pluck('name')->toArray();
        }
        
        $weakSubtopicNameDisplay = count($weakSubtopicNames) > 0 ? implode(', ', $weakSubtopicNames) : null;
        $weakSubtopicId   = $progress->focused_subtopic_id;

        $mode          = $progress->current_mode;
        $progressLevel = $progress->current_level;
        $attemptLevel  = $attempt?->level;
        $nextAction    = $progress->next_action;

        // Penting:
        // Untuk halaman summary, pakai level attempt yang BARU SELESAI.
        // Jangan pakai current_level dari progress sebagai acuan utama,
        // karena progress biasanya sudah naik ke level berikutnya.
        $baseLevel = $attemptLevel ?? $progressLevel;

        // Normalisasi kalau ada data lama 'normal' dipakai sebagai level
        if ($baseLevel === 'normal') {
            $baseLevel = 'medium';
        }

        // ── Lulus semua level
        if ($mode === 'passed') {
            return [
                'next_level'           => null,
                'message'              => 'Materi selesai. Lanjut ke materi berikutnya.',
                'action'               => 'go_next_material',
                'mode'                 => 'regular',
                'focused_subtopic_id'  => null,
                'weak_subtopic_name'   => null,
                'remediation_round'    => 0,
                'recommend_review'     => false,
            ];
        }

        // ── Harus baca ulang materi
        if ($mode === 'repeat_material') {
            return [
                'next_level'           => $baseLevel,
                'message'              => 'Baca ulang materi sebelum lanjut latihan.',
                'action'               => 'read_material_again',
                'mode'                 => 'regular',
                'focused_subtopic_id'  => null,
                'weak_subtopic_name'   => null,
                'remediation_round'    => 0,
                'recommend_review'     => true,
            ];
        }

        // ── Focused remedial
        if ($mode === 'focused_remedial') {
            $frontendAction = match ($nextAction) {
                'repeat_easy_subtopic'   => $baseLevel === 'easy'   ? 'retry' : 'fallback_easy',
                'repeat_medium_subtopic' => $baseLevel === 'medium' ? 'retry' : 'fallback_medium',
                'repeat_hard_subtopic'   => 'retry',
                default                  => 'retry',
            };

            $remedialNextLevel = match ($frontendAction) {
                'fallback_easy'   => 'easy',
                'fallback_medium' => 'medium',
                default           => $baseLevel,
            };

            return [
                'next_level'           => $remedialNextLevel,
                'message'              => $frontendAction === 'retry' 
                                            ? 'Ulangi latihan pada sub-topik yang masih lemah.' 
                                            : 'Kamu diturunkan ke level ' . strtoupper($remedialNextLevel) . ' untuk memperkuat sub-topik yang lemah.',
                'action'               => $frontendAction,
                'mode'                 => 'remedial',
                'focused_subtopic_id'  => $weakSubtopicId,
                'weak_subtopic_name'   => $weakSubtopicNameDisplay,
                'remediation_round'    => (int) (($progress->easy_remedial_count ?? 0) + ($progress->medium_remedial_count ?? 0)),
                'recommend_review'     => false,
            ];
        }

        // ── Normal — naik level atau lanjut
        $frontendAction = match ($nextAction) {
            'start_easy'       => 'next_level',
            'start_medium'     => 'next_level',
            'start_hard'       => 'next_level',
            'go_next_material' => 'go_next_material',
            default            => 'next_level',
        };

        if ($attempt && $attempt->attempt_type === 'pretest') {
            // Jika pretest, level selanjutnya adalah level yang ditetapkan di progress
            $nextLevel = $progressLevel;
            $message = 'Hasil pretest menentukan kamu mulai dari level ' . strtoupper($nextLevel ?? 'EASY') . '.';
        } else {
            $nextLevelMap = [
                'easy'   => 'medium',
                'medium' => 'hard',
                'hard'   => null,
            ];
            $nextLevel = $nextLevelMap[$baseLevel] ?? null;
            $message = 'Lanjutkan latihan sesuai hasil sesi ini.';
        }

        return [
            'next_level'           => $nextLevel,
            'message'              => $message,
            'action'               => $frontendAction,
            'mode'                 => 'regular',
            'focused_subtopic_id'  => null,
            'weak_subtopic_name'   => null,
            'remediation_round'    => 0,
            'recommend_review'     => false,
        ];
    }
}