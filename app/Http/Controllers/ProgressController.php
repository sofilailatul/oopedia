<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\ClassModel;
use App\Models\MaterialModel;
use App\Models\PracticeAttemptModel;
use App\Models\QuizAttemptModel;
use App\Models\QuizModel;
use App\Models\UserModel;
use App\Models\UserProgressModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class ProgressController extends Controller
{
    public function myProgress(Request $request)
    {
        $user = $request->user();

        $progress = UserProgressModel::with(['material', 'class'])
            ->where('user_id', $user->id)
            ->orderBy('id')
            ->get();

        return response()->json($progress);
    }

    public function dosenClassScoresPage(Request $request)
    {
        $user = $request->user();

        $isSuperadmin = $user->role === 'superadmin';

        $classesQuery = ClassModel::withCount([
            'users as students_count' => function ($q) {
                $q->where('role', 'mahasiswa');
            },
        ])
            ->orderBy('class_name');

        if (! $isSuperadmin) {
            $classesQuery->managedByLecturer($user->id);
        }

        $classes = $classesQuery->get(['id', 'class_name', 'class_code']);

        $selectedClassId = $request->integer('class_id') ?: ($classes->first()->id ?? null);
        $classDetail = null;

        if ($selectedClassId) {
            $classQuery = ClassModel::with([
                'users' => function ($q) {
                    $q->where('role', 'mahasiswa')
                        ->orderBy('nama');
                },
            ]);

            if (! $isSuperadmin) {
                $classQuery->managedByLecturer($user->id);
            }

            $class = $classQuery->findOrFail($selectedClassId);

            $quizzes = QuizModel::where('class_id', $class->id)
                ->orderBy('id')
                ->get(['id', 'title']);

            $studentIds = $class->users->pluck('id');
            $quizIds = $quizzes->pluck('id');

            // Practice summary per student (best final_score across all materials, all levels)
            $materialIds = \App\Models\MaterialModel::pluck('id');
            $hardMap = [];

            if ($studentIds->isNotEmpty() && $materialIds->isNotEmpty()) {
                $hardScores = DB::table('practice_attempts')
                    ->join('practices', 'practices.id', '=', 'practice_attempts.practices_id')
                    ->whereIn('practice_attempts.user_id', $studentIds)
                    ->whereIn('practices.material_id', $materialIds)
                    ->whereNotNull('practice_attempts.finished_at')
                    ->select('practice_attempts.user_id', DB::raw('MAX(practice_attempts.final_score) as best_score'))
                    ->groupBy('practice_attempts.user_id')
                    ->get();

                foreach ($hardScores as $row) {
                    $hardMap[$row->user_id] = (int) $row->best_score;
                }
            }

            $latestAttempts = collect();
            if ($studentIds->isNotEmpty() && $quizIds->isNotEmpty()) {
                $attempts = QuizAttemptModel::whereIn('user_id', $studentIds)
                    ->whereIn('quizzes_id', $quizIds)
                    ->whereNotNull('finished_at')
                    ->orderBy('finished_at')
                    ->get(['id', 'user_id', 'quizzes_id', 'total_score', 'finished_at']);

                $latestAttempts = $attempts->groupBy(function ($attempt) {
                    return $attempt->user_id . '-' . $attempt->quizzes_id;
                })->map(function ($group) {
                    return $group->last();
                });
            }

            $students = $class->users->map(function ($student) use ($quizzes, $latestAttempts, $hardMap) {
                $perQuiz = [];
                $totalScore = 0;
                $completedCount = 0;

                foreach ($quizzes as $quiz) {
                    $key = $student->id . '-' . $quiz->id;
                    $attempt = $latestAttempts->get($key);
                    $score = $attempt ? $attempt->total_score : null;

                    $perQuiz[] = [
                        'quiz_id' => $quiz->id,
                        'score' => $score,
                    ];

                    if ($score !== null) {
                        $totalScore += $score;
                        $completedCount++;
                    }
                }

                $average = $completedCount > 0 ? round($totalScore / $completedCount, 1) : null;
                $hardScore = $hardMap[$student->id] ?? null;

                return [
                    'id' => $student->id,
                    'nama' => $student->nama,
                    'email' => $student->email,
                    'hard_score' => $hardScore,
                    'average_score' => $average,
                    'completed_quizzes' => $completedCount,
                    'scores' => $perQuiz,
                ];
            });

            $classDetail = [
                'id' => $class->id,
                'class_name' => $class->class_name,
                'class_code' => $class->class_code,
                'quizzes' => $quizzes->map(function ($quiz) {
                    return [
                        'id' => $quiz->id,
                        'title' => $quiz->title,
                    ];
                })->values(),
                'students' => $students->values(),
            ];
        }

        return Inertia::render('ManageLeaderboard/Index', [
            'classes' => $classes,
            'selectedClassId' => $selectedClassId,
            'classDetail' => $classDetail,
            'authUser' => $user,
        ]);
    }

    public function dosenStudentDetailPage(Request $request, UserModel $student)
    {
        $lecturer = $request->user();
        $classId = $request->integer('class_id');

        if (!$classId) {
            abort(404);
        }

        $isSuperadmin = $lecturer->role === 'superadmin';

        $classQuery = ClassModel::with(['users' => function ($q) {
            $q->where('role', 'mahasiswa');
        }]);

        if (! $isSuperadmin) {
            $classQuery->where('created_by', $lecturer->id);
        }

        $class = $classQuery->findOrFail($classId);

        $isMember = $class->users->contains('id', $student->id);
        abort_unless($isMember, 404);

        // Build per-material summary (pretest/easy/normal/hard/quiz) for this student
        $materialsList = MaterialModel::query()
            ->orderBy('order_number')
            ->get(['id', 'material_name']);

        $materialStats = $this->buildStudentMaterialStats($student->id, $materialsList);

        $quizStats = $this->buildStudentQuizStats($student->id, $class->id);

        $backRouteName = $isSuperadmin ? 'grades.index' : 'dosen.grades.index';

        return Inertia::render('ManageLeaderboard/Show', [
            'class' => [
                'id' => $class->id,
                'class_name' => $class->class_name,
                'class_code' => $class->class_code,
            ],
            'student' => [
                'id' => $student->id,
                'nama' => $student->nama,
                'email' => $student->email,
            ],
            'materialStats' => $materialStats,
            'quizStats' => $quizStats,
            'backRouteName' => $backRouteName,
            'authUser' => $lecturer,
        ]);
    }

    public function exportClassScores(Request $request)
    {
        $user = $request->user();
        $classId = $request->integer('class_id');

        if (!$classId) {
            abort(404, 'Class ID is required.');
        }

        $isSuperadmin = $user->role === 'superadmin';

        $classQuery = ClassModel::with([
            'users' => function ($q) {
                $q->where('role', 'mahasiswa')->orderBy('nama');
            },
        ]);

        if (!$isSuperadmin) {
            $classQuery->where('created_by', $user->id);
        }

        $class = $classQuery->findOrFail($classId);
        Log::info('Export class scores class resolved', [
            'class_id' => $class->id,
            'class_code' => $class->class_code,
            'class_name' => $class->class_name,
        ]);
        $students = $class->users;
        $studentIds = $students->pluck('id');

        $materials = MaterialModel::query()
            ->orderBy('order_number')
            ->get(['id', 'material_name']);
        $materialIds = $materials->pluck('id');

        $practiceMap = [];
        if ($studentIds->isNotEmpty() && $materialIds->isNotEmpty()) {
            $practiceAttempts = DB::table('practice_attempts')
                ->join('practices', 'practices.id', '=', 'practice_attempts.practices_id')
                ->whereIn('practice_attempts.user_id', $studentIds)
                ->whereNotNull('practice_attempts.finished_at')
                ->whereIn('practices.material_id', $materialIds)
                ->select(
                    'practice_attempts.user_id',
                    'practices.material_id',
                    'practices.level',
                    'practice_attempts.attempt_type',
                    'practice_attempts.mode',
                    DB::raw('MAX(practice_attempts.final_score) as best_score')
                )
                ->groupBy('practice_attempts.user_id', 'practices.material_id', 'practices.level', 'practice_attempts.attempt_type', 'practice_attempts.mode')
                ->get();

            foreach ($practiceAttempts as $row) {
                $key = $row->level;
                if ($key === 'normal') {
                    $key = 'medium';
                }

                if ($row->attempt_type === 'pretest') {
                    $key = 'pretest';
                } elseif ($row->mode === 'focused_remedial') {
                    $remedLevel = $row->level === 'normal' ? 'medium' : $row->level;
                    $key = 'remed_' . $remedLevel;
                }

                $practiceMap[$row->user_id][$row->material_id][$key] = (int) $row->best_score;
            }
        }

        $quizzes = QuizModel::query()
            ->where('class_id', $class->id)
            ->orderBy('id')
            ->get(['id', 'title']);
        $quizIds = $quizzes->pluck('id');

        $latestAttempts = collect();
        if ($studentIds->isNotEmpty() && $quizIds->isNotEmpty()) {
            $attempts = QuizAttemptModel::query()
                ->whereIn('user_id', $studentIds)
                ->whereIn('quizzes_id', $quizIds)
                ->whereNotNull('finished_at')
                ->orderBy('finished_at')
                ->get(['id', 'user_id', 'quizzes_id', 'total_score', 'finished_at']);

            $latestAttempts = $attempts->groupBy(function ($attempt) {
                return $attempt->user_id . '-' . $attempt->quizzes_id;
            })->map(function ($group) {
                return $group->last();
            });
        }

        $attemptIds = $latestAttempts->pluck('id')->filter()->values();
        $materialScores = collect();
        if ($attemptIds->isNotEmpty()) {
            $materialScores = DB::table('quiz_attempt_material_scores')
                ->whereIn('quiz_attempts_id', $attemptIds)
                ->select('quiz_attempts_id', 'material_id', 'earned_score', 'max_score')
                ->get()
                ->groupBy('quiz_attempts_id');
        }

        $fileName = 'nilai_kelas_' . $class->class_code . '_' . now()->format('Ymd_His') . '.xlsx';

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

            $header = ['Nama', 'Email'];
            foreach ($materials as $material) {
                $prefix = 'Materi ' . $material->material_name . ' - ';
                $header[] = $prefix . 'Pretest';
                $header[] = $prefix . 'Easy';
                $header[] = $prefix . 'Remed Easy';
                $header[] = $prefix . 'Medium';
                $header[] = $prefix . 'Remed Medium';
                $header[] = $prefix . 'Hard';
                $header[] = $prefix . 'Remed Hard';
            }

            foreach ($quizzes as $quiz) {
                $header[] = 'Quiz ' . $quiz->title . ' - Total';
            }

            foreach ($quizzes as $quiz) {
                foreach ($materials as $material) {
                    $header[] = 'Quiz ' . $quiz->title . ' - ' . $material->material_name . ' (%)';
                }
            }

        $sheet->fromArray($header, null, 'A1');

        $rowIndex = 2;
        foreach ($students as $student) {
            $row = [$student->nama, $student->email];

            foreach ($materials as $material) {
                $scores = $practiceMap[$student->id][$material->id] ?? [];
                $row[] = $scores['pretest'] ?? 0;
                $row[] = $scores['easy'] ?? 0;
                $row[] = $scores['remed_easy'] ?? 0;
                $row[] = $scores['medium'] ?? 0;
                $row[] = $scores['remed_medium'] ?? 0;
                $row[] = $scores['hard'] ?? 0;
                $row[] = $scores['remed_hard'] ?? 0;
            }

            foreach ($quizzes as $quiz) {
                $key = $student->id . '-' . $quiz->id;
                $attempt = $latestAttempts->get($key);
                $row[] = $attempt ? (int) $attempt->total_score : '';
            }

            foreach ($quizzes as $quiz) {
                $key = $student->id . '-' . $quiz->id;
                $attempt = $latestAttempts->get($key);
                $attemptScores = $attempt
                    ? $materialScores->get($attempt->id, collect())
                    : collect();

                $scoreMap = $attemptScores->keyBy('material_id');

                foreach ($materials as $material) {
                    $entry = $scoreMap->get($material->id);
                    if (! $entry || (int) $entry->max_score === 0) {
                        $row[] = '';
                        continue;
                    }

                    $percent = round(((int) $entry->earned_score / (int) $entry->max_score) * 100);
                    $row[] = $percent;
                }
            }

            $sheet->fromArray($row, null, 'A' . $rowIndex);
            $rowIndex++;
        }

        $tmpDir = storage_path('app/tmp');
        if (! is_dir($tmpDir)) {
            mkdir($tmpDir, 0775, true);
        }

        $filePath = $tmpDir . DIRECTORY_SEPARATOR . $fileName;
        $writer = new Xlsx($spreadsheet);
        $writer->save($filePath);

        return response()->download(
            $filePath,
            $fileName,
            ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
        )->deleteFileAfterSend(true);
    }

    public function getLatestQuizAttempt(Request $request, int $classId, int $studentId, int $quizId)
    {
        $user = $request->user();
        $isSuperadmin = $user->role === 'superadmin';

        $classQuery = ClassModel::query();
        if (! $isSuperadmin) {
            $classQuery->where('created_by', $user->id);
        }

        $class = $classQuery->findOrFail($classId);

        $isMember = DB::table('class_user')
            ->where('class_id', $class->id)
            ->where('user_id', $studentId)
            ->exists();
        abort_unless($isMember, 404);

        $quiz = QuizModel::where('class_id', $class->id)->findOrFail($quizId);

        $attempt = QuizAttemptModel::query()
            ->where('user_id', $studentId)
            ->where('quizzes_id', $quiz->id)
            ->whereNotNull('finished_at')
            ->orderByDesc('finished_at')
            ->first();

        if (! $attempt) {
            // If no attempt, return materials from quiz with 0 scores
            $materials = $quiz->materials()->orderBy('order_number')->get();
            $materialScores = $materials->map(function ($m) {
                return [
                    'material_id' => $m->id,
                    'material_name' => $m->material_name,
                    'earned_score' => 0,
                    'max_score' => 0,
                    'percentage' => 0,
                ];
            });

            return response()->json([
                'attempt_id' => null,
                'quiz_id' => $quiz->id,
                'quiz_title' => $quiz->title,
                'total_score' => 0,
                'materials' => $materialScores,
            ]);
        }

        $materialScores = DB::table('quiz_attempt_material_scores')
            ->join('materials', 'materials.id', '=', 'quiz_attempt_material_scores.material_id')
            ->where('quiz_attempts_id', $attempt->id)
            ->select(
                'quiz_attempt_material_scores.material_id',
                'materials.material_name',
                'quiz_attempt_material_scores.earned_score',
                'quiz_attempt_material_scores.max_score',
                'quiz_attempt_material_scores.percentage'
            )
            ->orderBy('materials.order_number')
            ->get();

        return response()->json([
            'attempt_id' => $attempt->id,
            'quiz_id' => $quiz->id,
            'quiz_title' => $quiz->title,
            'total_score' => (int) ($attempt->total_score ?? 0),
            'materials' => $materialScores,
        ]);
    }

    public function updateLatestQuizAttempt(Request $request, int $classId, int $studentId, int $quizId)
    {
        $user = $request->user();
        $isSuperadmin = $user->role === 'superadmin';

        $classQuery = ClassModel::query();
        if (! $isSuperadmin) {
            $classQuery->where('created_by', $user->id);
        }

        $class = $classQuery->findOrFail($classId);

        $isMember = DB::table('class_user')
            ->where('class_id', $class->id)
            ->where('user_id', $studentId)
            ->exists();
        abort_unless($isMember, 404);

        $quiz = QuizModel::where('class_id', $class->id)->findOrFail($quizId);

        $attempt = QuizAttemptModel::query()
            ->where('user_id', $studentId)
            ->where('quizzes_id', $quiz->id)
            ->whereNotNull('finished_at')
            ->orderByDesc('finished_at')
            ->first();

        if (! $attempt) {
            $attempt = QuizAttemptModel::create([
                'user_id' => $studentId,
                'quizzes_id' => $quiz->id,
                'started_at' => now(),
                'finished_at' => now(),
                'total_score' => 0,
            ]);
        }

        $data = $request->validate([
            'total_score' => ['nullable', 'integer', 'min:0'],
            'materials' => ['nullable', 'array'],
            'materials.*.material_id' => ['required_with:materials', 'integer'],
            'materials.*.earned_score' => ['required_with:materials', 'integer', 'min:0'],
            'materials.*.max_score' => ['nullable', 'integer', 'min:0'],
        ]);

        $totalScore = $data['total_score'] ?? null;
        $materialsPayload = $data['materials'] ?? [];

        DB::transaction(function () use ($attempt, $materialsPayload, &$totalScore) {
            $sumScore = 0;

            foreach ($materialsPayload as $item) {
                $materialId = (int) $item['material_id'];
                $earnedScore = (int) $item['earned_score'];
                $maxScore = array_key_exists('max_score', $item)
                    ? (int) $item['max_score']
                    : null;

                $scoreRow = DB::table('quiz_attempt_material_scores')
                    ->where('quiz_attempts_id', $attempt->id)
                    ->where('material_id', $materialId)
                    ->first();

                $finalMaxScore = $maxScore ?? (int) ($scoreRow->max_score ?? 0);
                $percentage = $finalMaxScore > 0
                    ? (int) round(($earnedScore / $finalMaxScore) * 100)
                    : 0;

                if ($scoreRow) {
                    DB::table('quiz_attempt_material_scores')
                        ->where('quiz_attempts_id', $attempt->id)
                        ->where('material_id', $materialId)
                        ->update([
                            'earned_score' => $earnedScore,
                            'max_score' => $finalMaxScore,
                            'percentage' => $percentage,
                            'updated_at' => now(),
                        ]);
                } else {
                    DB::table('quiz_attempt_material_scores')
                        ->insert([
                            'quiz_attempts_id' => $attempt->id,
                            'material_id' => $materialId,
                            'earned_score' => $earnedScore,
                            'max_score' => $finalMaxScore,
                            'percentage' => $percentage,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                }

                $sumScore += $earnedScore;
            }

            if ($totalScore === null) {
                $totalScore = $sumScore;
            }

            QuizAttemptModel::where('id', $attempt->id)
                ->update(['total_score' => $totalScore]);
        });

        return response()->json(['message' => 'Nilai quiz berhasil diperbarui.']);
    }

    private function resolvePracticeStatus($lastAttempt): string
    {
        if (!$lastAttempt) {
            return 'Belum mulai';
        }

        if (!empty($lastAttempt->next_action)) {
            return match ($lastAttempt->next_action) {
                'go_easy' => 'Sedang Easy',
                'go_medium' => 'Sedang Medium',
                'go_normal' => 'Sedang Medium',
                'go_hard' => 'Sedang Hard',
                'remedial_easy' => 'Remedial Easy',
                'remedial_medium' => 'Remedial Medium',
                'remedial_normal' => 'Remedial Medium',
                'remedial_hard' => 'Remedial Hard',
                'review_material' => 'Perlu baca ulang',
                'completed' => 'Lulus',
                default => $lastAttempt->next_action,
            };
        }

        if ((bool) $lastAttempt->is_passed) {
            if ($lastAttempt->level === 'hard') {
                return 'Lulus';
            }

            if ($lastAttempt->level === 'easy') {
                return 'Sedang Medium';
            }

            if ($lastAttempt->level === 'medium' || $lastAttempt->level === 'normal') {
                return 'Sedang Hard';
            }
        }

        if ($lastAttempt->mode === 'focused_remedial') {
            return 'Remedial ' . ucfirst($lastAttempt->level ?? '');
        }

        if ($lastAttempt->level) {
            return 'Sedang ' . ucfirst($lastAttempt->level);
        }

        return 'Sedang latihan';
    }

    private function buildStudentMaterialStats(int $studentId, $materials)
    {
        $attemptRows = DB::table('practice_attempts')
            ->join('practices', 'practices.id', '=', 'practice_attempts.practices_id')
            ->leftJoin('subtopics', 'subtopics.id', '=', 'practice_attempts.focused_subtopic_id')
            ->where('practice_attempts.user_id', $studentId)
            ->whereNotNull('practice_attempts.finished_at')
            ->select(
                'practices.material_id',
                'practice_attempts.attempt_type',
                'practice_attempts.level',
                'practice_attempts.mode',
                'practice_attempts.focused_subtopic_id',
                'practice_attempts.final_score',
                'practice_attempts.is_passed',
                'practice_attempts.next_action',
                'practice_attempts.finished_at',
                'subtopics.name as subtopic_name'
            )
            ->orderBy('practice_attempts.finished_at')
            ->get();

        $stats = [];

        foreach ($materials as $material) {
            $stats[$material->id] = [
                'material_id' => $material->id,
                'material_name' => $material->material_name,

                'pretest' => 0,

                'easy' => 0,
                'remed_easy' => 0,

                'medium' => 0,
                'remed_medium' => 0,

                'hard' => 0,
                'remed_hard' => 0,

                'weak_easy_subtopics' => [],
                'weak_medium_subtopics' => [],
                'weak_hard_subtopics' => [],

                'quiz' => 0,
                'total' => 0,

                'status' => 'Belum mulai',
                '_last_attempt' => null,
            ];
        }

        foreach ($attemptRows as $row) {
            if (!isset($stats[$row->material_id])) {
                continue;
            }

            $score = (int) ($row->final_score ?? 0);
            $level = $row->level;
            $mode = $row->mode;
            $attemptType = $row->attempt_type;

            if ($attemptType === 'pretest') {
                $stats[$row->material_id]['pretest'] = max(
                    $stats[$row->material_id]['pretest'],
                    $score
                );
            }

            if ($attemptType === 'practice' && $mode === 'normal') {
                if ($level === 'easy') {
                    $stats[$row->material_id]['easy'] = max($stats[$row->material_id]['easy'], $score);
                }

                if ($level === 'medium' || $level === 'normal') {
                    $stats[$row->material_id]['medium'] = max($stats[$row->material_id]['medium'], $score);
                }

                if ($level === 'hard') {
                    $stats[$row->material_id]['hard'] = max($stats[$row->material_id]['hard'], $score);
                }
            }

            if ($attemptType === 'practice' && $mode === 'focused_remedial') {
                $remedKey = 'remed_' . ($level === 'normal' ? 'medium' : $level);
                $weakKey = 'weak_' . ($level === 'normal' ? 'medium' : $level) . '_subtopics';

                $stats[$row->material_id][$remedKey] = max($stats[$row->material_id][$remedKey], $score);

                if ($row->subtopic_name) {
                    $stats[$row->material_id][$weakKey][$row->focused_subtopic_id] = $row->subtopic_name;
                }
            }

            $stats[$row->material_id]['_last_attempt'] = $row;
        }

        // --- QUIZ SCORES per material for this student ---
        $quizScores = DB::table('quiz_attempt_material_scores')
            ->join('quiz_attempts', 'quiz_attempts.id', '=', 'quiz_attempt_material_scores.quiz_attempts_id')
            ->where('quiz_attempts.user_id', $studentId)
            ->whereNotNull('quiz_attempts.finished_at')
            ->select(
                'quiz_attempt_material_scores.material_id',
                DB::raw('SUM(quiz_attempt_material_scores.earned_score) as total_quiz_score')
            )
            ->groupBy('quiz_attempt_material_scores.material_id')
            ->get();

        foreach ($quizScores as $qs) {
            if (isset($stats[$qs->material_id])) {
                $stats[$qs->material_id]['quiz'] = (int) $qs->total_quiz_score;
            }
        }

        foreach ($stats as $materialId => $row) {
            $lastAttempt = $row['_last_attempt'];

            // Convert weak subtopic associative arrays to flat arrays
            foreach (['easy', 'medium', 'hard'] as $lvl) {
                $wkKey = "weak_{$lvl}_subtopics";
                if (isset($row[$wkKey]) && is_array($row[$wkKey])) {
                    $stats[$materialId][$wkKey] = array_values($row[$wkKey]);
                } else {
                    $stats[$materialId][$wkKey] = [];
                }
            }

            // Calculate Total
            $stats[$materialId]['total'] = $row['pretest'] 
                + max($row['easy'], $row['remed_easy']) 
                + max($row['medium'], $row['remed_medium']) 
                + max($row['hard'], $row['remed_hard']) 
                + ($stats[$materialId]['quiz'] ?? 0);

            $stats[$materialId]['status'] = $this->resolvePracticeStatus($lastAttempt);

            unset($stats[$materialId]['_last_attempt']);
        }

        return array_values($stats);
    }

    private function buildStudentQuizStats(int $studentId, int $classId)
    {
        $attempts = QuizAttemptModel::query()
            ->with([
                'quiz:id,title,class_id',
                'materialScores.material:id,material_name',
            ])
            ->where('user_id', $studentId)
            ->whereNotNull('finished_at')
            ->whereHas('quiz', function ($query) use ($classId) {
                $query->where('class_id', $classId);
            })
            ->orderBy('finished_at')
            ->get();

        return $attempts->map(function ($attempt) {
            $materials = $attempt->materialScores->map(function ($score) {
                return [
                    'material_id' => $score->material_id,
                    'material_name' => $score->material?->material_name ?? 'Materi tidak ditemukan',
                    'score' => (int) ($score->earned_score ?? 0),
                    'max_score' => (int) ($score->max_score ?? 0),
                    'percentage' => (float) ($score->percentage ?? 0),
                ];
            })->values();

            return [
                'quiz_id' => $attempt->quizzes_id,
                'quiz_title' => $attempt->quiz?->title ?? 'Quiz',
                'attempt_id' => $attempt->id,
                'materials' => $materials,
                'total_score' => (int) ($attempt->total_score ?? $materials->sum('score')),
                'finished_at' => $attempt->finished_at,
            ];
        })->values();
    }
}
