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

        if ($attempt->mode === 'focused_remedial' && empty($cfg['weak_subtopic_id'])) {
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

        // ── FOCUSED REMEDIAL: tetap fokus ke subtopik lemah ─────────────────────
        if ($attempt->mode === 'focused_remedial' && !empty($cfg['weak_subtopic_id'])) {
            $questionsQuery = PracticeQuestionModel::query()
                ->where('practices_id', $attempt->practices_id)
                ->where('subtopic_id', $cfg['weak_subtopic_id'])
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
                    ->whereHas('question', function ($q) use ($cfg) {
                        $q->where('subtopic_id', $cfg['weak_subtopic_id']);
                    })
                    ->pluck('practice_questions_id')
                    ->toArray();

                $questions = PracticeQuestionModel::query()
                    ->where('practices_id', $attempt->practices_id)
                    ->where('subtopic_id', $cfg['weak_subtopic_id'])
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
            $weak = $this->learningPathService->detectWeakSubtopic($attempt->id);
            $progress = UserProgressModel::query()->findOrFail($attempt->user_progress_id);
            $passingThreshold = $attempt->level === 'hard' ? 80 : 60;
            $isPassed = $score >= $passingThreshold;

            $resolvedSubtopicId = $weak->subtopic_id
                ?? $attempt->focused_subtopic_id
                ?? $progress->focused_subtopic_id;

            $attempt->update([
                'final_score'         => $score,
                'focused_subtopic_id' => $resolvedSubtopicId,
                'is_passed'           => $isPassed ? 1 : 0,
                'finished_at'         => now(),
            ]);

            if ($attempt->attempt_type === 'pretest') {
                $updatedProgress = $this->learningPathService->handlePretest(
                    $progress,
                    $score,
                    $resolvedSubtopicId
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
            ]);
        });

        return redirect()->route('practices.summary', $attempt->practices_id)
            ->with('success', 'Jawaban berhasil dikumpulkan.');
    }

    public function summary(PracticeModel $practice)
    {
        $userId = Auth::id();
        $mode = request()->query('mode');

        $attemptQuery = PracticeAttemptModel::where('user_id', $userId)
            ->where('practices_id', $practice->id)
            ->whereNotNull('finished_at');

        if (in_array($mode, ['normal', 'focused_remedial'], true)) {
            $attemptQuery->where('mode', $mode);
        }

        $attempt = $attemptQuery
            ->latest()
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

        $resolvedIds = [];
        $nameToIdCache = [];

        foreach ($answers as $answer) {
            $question = $answer->question;
            if (!$question) {
                continue;
            }

            $resolvedId = $question->subtopic_id;

            if (!$resolvedId) {
                $rawName = trim((string) ($question->sub_topic ?? ''));

                if ($rawName !== '') {
                    if (!array_key_exists($rawName, $nameToIdCache)) {
                        $nameToIdCache[$rawName] = $this->resolveSubTopicId($practice->material_id, $rawName);
                    }

                    $resolvedId = $nameToIdCache[$rawName];
                }
            }

            if ($resolvedId) {
                $question->setAttribute('sub_topic_id', (int) $resolvedId);
                $resolvedIds[] = (int) $resolvedId;
            }
        }

        $subTopicNames = empty($resolvedIds)
            ? collect()
            : SubTopicModel::query()
                ->whereIn('id', array_values(array_unique($resolvedIds)))
                ->pluck('name', 'id');

        foreach ($answers as $answer) {
            $question = $answer->question;
            if (!$question) {
                continue;
            }

            $subTopicId = (int) ($question->sub_topic_id ?? 0);
            if ($subTopicId > 0) {
                $question->setAttribute('sub_topic_name', $subTopicNames->get($subTopicId));
            }
        }

        $cfg = $this->buildAttemptConfig($attempt, $practice);

        $progress = UserProgressModel::query()
            ->where('user_id', $userId)
            ->where('material_id', $practice->material_id)
            ->first();

        $nextLevel = $this->nextLevelFromProgress($progress, $attempt);

        return Inertia::render('Practices/Summary', [
            'practice'  => $practice,
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

        $progress->loadMissing('focusedSubtopic');
        $weakSubtopicName = $progress->focusedSubtopic?->name ?? null;
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

            return [
                'next_level'           => $baseLevel,
                'message'              => 'Ulangi latihan pada sub-topik yang masih lemah.',
                'action'               => $frontendAction,
                'mode'                 => 'remedial',
                'focused_subtopic_id'  => $weakSubtopicId,
                'weak_subtopic_name'   => $weakSubtopicName,
                'remediation_round'    => (int) (($progress->easy_remedial_count ?? 0) + ($progress->medium_remedial_count ?? 0)),
                'recommend_review'     => false,
            ];
        }

        // ── Normal — naik level atau lanjut
        $frontendAction = match ($nextAction) {
            'start_medium'     => 'next_level',
            'start_hard'       => 'next_level',
            'go_next_material' => 'go_next_material',
            default            => 'next_level',
        };

        $nextLevelMap = [
            'easy'   => 'medium',
            'medium' => 'hard',
            'hard'   => null,
        ];

        $nextLevel = $nextLevelMap[$baseLevel] ?? null;

        return [
            'next_level'           => $nextLevel,
            'message'              => 'Lanjutkan latihan sesuai hasil sesi ini.',
            'action'               => $frontendAction,
            'mode'                 => 'regular',
            'focused_subtopic_id'  => null,
            'weak_subtopic_name'   => null,
            'remediation_round'    => 0,
            'recommend_review'     => false,
        ];
    }
}