<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\MaterialModel;
use App\Models\PracticeModel;
use App\Models\QuizModel;
use App\Models\UserModel;
use App\Models\ClassModel; 
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Handle dashboard redirect based on user role
     */
    public function index(Request $request)
    {
        $user = $request->user();

        return match ($user->role) {
            'tamu' => $this->tamuDashboard($user),

            'dosen' => $this->dosenDashboard(),

            'superadmin' => $this->superadminDashboard(),

            'mahasiswa' => $this->mahasiswaDashboard($user),

            default => abort(403),
        };
    }

    /**
     * Dashboard untuk TAMU (belum join kelas)
     */
    protected function tamuDashboard()
    {
        return Inertia::render('Tamu/Dashboard', [
            'stats' => [
                'total_materials' => MaterialModel::count(),
                'total_practices' => PracticeModel::count(),
                'total_quizzes' => QuizModel::count(),
            ],
        ]);
    }

    /**
     * Dashboard untuk MAHASISWA
     */
    protected function mahasiswaDashboard($user)
    {
        $userId  = $user->id;
    
        // ── Kelas ────────────────────────────────────────────────────────────
        $classId  = DB::table('class_user')
            ->where('user_id', $userId)
            ->value('class_id');
    
        $hasClass = !is_null($classId);
    
        // ── Stats skeleton ───────────────────────────────────────────────────
        $stats = [
            'materials_completed'      => 0,
            'total_materials'          => 0,
            'practices_completed'      => 0,
            'total_practices'          => 0,
            'quizzes_completed'        => 0,
            'total_quizzes'            => 0,
            'avg_quiz_score'           => null,
            'total_time_spent_seconds' => 0,
            'total_points'             => 0,
            'practice_by_difficulty'   => [],
            'all_difficulty_completed' => false,
        ];
    
        // ── Quiz ─────────────────────────────────────────────────────────────
        if ($hasClass) {
            $quizBase = DB::table('quiz_attempts as qa')
                ->join('quizzes as q', 'q.id', '=', 'qa.quizzes_id')
                ->where('qa.user_id', $userId)
                ->where('q.class_id', $classId)
                ->whereNotNull('qa.finished_at');
    
            $stats['quizzes_completed'] = $quizBase->count();
            $avg                        = $quizBase->avg('qa.total_score');
            $stats['total_quizzes']     = QuizModel::where('class_id', $classId)->count();
        } else {
            $stats['quizzes_completed'] = DB::table('quiz_attempts')
                ->where('user_id', $userId)
                ->whereNotNull('finished_at')
                ->count();
    
            $avg = DB::table('quiz_attempts')
                ->where('user_id', $userId)
                ->whereNotNull('finished_at')
                ->avg('total_score');
    
            $stats['total_quizzes'] = QuizModel::count();
        }
        $stats['avg_quiz_score'] = $avg !== null ? round($avg, 1) : null;
    
        // ── Points ───────────────────────────────────────────────────────────
        $practicePoints = DB::table('practice_attempts')
            ->where('user_id', $userId)
            ->whereNotNull('finished_at')
            ->sum('final_score');
    
        $quizPoints = DB::table('quiz_attempts')
            ->where('user_id', $userId)
            ->whereNotNull('finished_at')
            ->sum('total_score');
    
        $stats['total_points'] = (int) $practicePoints + (int) $quizPoints;
    
        // ── Total time ───────────────────────────────────────────────────────
        try {
            $stats['total_time_spent_seconds'] = (int) DB::table('study_sessions')
                ->where('user_id', $userId)
                ->sum('duration_seconds');
        } catch (\Throwable $e) {
            $stats['total_time_spent_seconds'] = 0;
        }
    
        // ── Materials (butuh kelas) ───────────────────────────────────────────
        if ($hasClass) {
            $dosenId = DB::table('classes')
                ->where('id', $classId)
                ->value('created_by');
    
            $stats['materials_completed'] = DB::table('user_progress')
                ->where('user_id', $userId)
                ->where('class_id', $classId)
                ->whereNotNull('read_at')
                ->count();
    
            $stats['total_materials'] = $dosenId
                ? DB::table('materials')->where('created_by', $dosenId)->count()
                : DB::table('materials')->count();
        }
    
        // ── Practice global ──────────────────────────────────────────────────
        $stats['total_practices'] = DB::table('practices')->distinct()->count('material_id');
    
        $stats['practices_completed'] = DB::table('practices as p')
            ->leftJoin('practice_attempts as pa', function ($join) use ($userId) {
                $join->on('pa.practices_id', '=', 'p.id')
                    ->where('pa.user_id', '=', $userId)
                    ->whereNotNull('pa.finished_at');
            })
            ->selectRaw('p.material_id')
            ->groupBy('p.material_id')
            ->havingRaw(
                'COUNT(DISTINCT p.level) = COUNT(DISTINCT CASE WHEN pa.practices_id IS NOT NULL THEN p.level END)'
            )
            ->get()
            ->count();
    
        $practiceByDifficulty             = DB::table('practices as p')
            ->leftJoin('practice_attempts as pa', function ($join) use ($userId) {
                $join->on('pa.practices_id', '=', 'p.id')
                    ->where('pa.user_id', '=', $userId)
                    ->whereNotNull('pa.finished_at');
            })
            ->selectRaw('p.level, COUNT(DISTINCT p.id) as total, COUNT(DISTINCT pa.practices_id) as completed')
            ->groupBy('p.level')
            ->get();
    
        $stats['practice_by_difficulty']   = $practiceByDifficulty;
        $stats['all_difficulty_completed'] = $practiceByDifficulty->isNotEmpty()
            ? $practiceByDifficulty->every(fn($row) => (int) $row->total > 0 && (int) $row->completed >= (int) $row->total)
            : false;
    

        $learningPath = $this->buildLearningPath($userId, $classId, $hasClass, $stats);
    
        return Inertia::render('Mahasiswa/Dashboard', [
            'auth'             => ['user' => $user],
            'stats'            => $stats,
            'recommendations'  => [],
            'recentActivities' => [],
            'hasClass'         => $hasClass,
            'learningPath'     => $learningPath,   // ← dikirim ke frontend
        ]);
    }
    
   
    private function buildLearningPath(int $userId, ?int $classId, bool $hasClass, array $stats): array
    {
        // Jika belum ada kelas, kembalikan skeleton kosong
        if (!$hasClass || !$classId) {
            return $this->emptyLearningPath($stats);
        }
    
        $dosenId = DB::table('classes')
            ->where('id', $classId)
            ->value('created_by');
    
        // ── 1. Ambil semua materi milik dosen kelas ini, urut by order/id ────
        $allMaterials = DB::table('materials')
            ->where('created_by', $dosenId)
            ->orderBy('order_number', 'asc')   
            ->orderBy('id', 'asc')
            ->get(['id', 'material_name']);
    
        if ($allMaterials->isEmpty()) {
            return $this->emptyLearningPath($stats);
        }
    
        // ── 2. Ambil user_progress untuk semua materi sekaligus ─────────────
        $materialIds = $allMaterials->pluck('id')->toArray();
    
        $progressMap = DB::table('user_progress')
            ->where('user_id', $userId)
            ->where('class_id', $classId)
            ->whereIn('material_id', $materialIds)
            ->get()
            ->keyBy('material_id');   // [material_id => progress_row]
    
        // ── 3. Tentukan materi aktif (materi pertama yang belum completed) ───
        $currentMaterialRow = null;
        $nextMaterialRow    = null;
        $currentProgress    = null;
    
        foreach ($allMaterials as $index => $material) {
            $progress = $progressMap->get($material->id);
    
            // Belum ada progress row ATAU belum completed → ini materi aktif
            $isCompleted = $progress && $progress->status === 'completed';
    
            if (!$isCompleted && $currentMaterialRow === null) {
                $currentMaterialRow = $material;
                $currentProgress    = $progress;
    
                // Materi berikutnya (index + 1)
                $nextMaterialRow = $allMaterials->get($index + 1);
                break;
            }
        }
    
        // Jika semua sudah completed, aktifkan materi terakhir
        if ($currentMaterialRow === null) {
            $currentMaterialRow = $allMaterials->last();
            $currentProgress    = $progressMap->get($currentMaterialRow->id);
            $nextMaterialRow    = null;
        }
    
        // ── 4. Baca status dari progress row ─────────────────────────────────
        //  user_progress kolom yang dipakai:
        //   read_at, completed_pretest_at, completed_practice_at,
        //   current_level, next_action, status
        $isRead           = $currentProgress && !is_null($currentProgress->read_at);
        $isPretestDone    = $currentProgress && !is_null($currentProgress->completed_pretest_at);
        $isPracticeDone   = $currentProgress && !is_null($currentProgress->completed_practice_at);
        $isCompleted      = $currentProgress && $currentProgress->status === 'completed';
        $currentLevel     = $currentProgress->current_level ?? null;
        $nextAction       = $currentProgress->next_action   ?? null;    // dari LearningPathService
    
        // ── 5. Hitung status tiap step ────────────────────────────────────────
        // read_status
        $readStatus = $isRead ? 'completed' : 'available';
    
        // practice_gate_status: terbuka setelah materi dibaca
        $practiceGateStatus = match(true) {
            $isPracticeDone  => 'completed',
            $isRead          => 'available',
            default          => 'locked',
        };
    
        // pretest_status
        $pretestStatus = match(true) {
            $isPretestDone => 'completed',
            $isRead        => 'available',
            default        => 'locked',
        };
    
        // level_practice_status
        $levelPracticeStatus = match(true) {
            $isPracticeDone => 'completed',
            $isPretestDone  => 'in_progress',
            default         => 'locked',
        };
    
        // next_material_status
        $nextMaterialStatus = match(true) {
            $isCompleted              => 'available',
            $isPracticeDone           => 'available',
            default                   => 'locked',
        };
    
        // ── 6. Quiz untuk kelas ini ───────────────────────────────────────────
        $quizData        = null;
        $quizNextAction  = null;
    
        $quizRow = DB::table('quizzes')
            ->where('class_id', $classId)
            ->first(['id', 'title', 'passing_score']);
    
        if ($quizRow) {
            // Cek apakah quiz sudah attempt + selesai
            $quizAttempt = DB::table('quiz_attempts')
                ->where('user_id', $userId)
                ->where('quizzes_id', $quizRow->id)
                ->whereNotNull('finished_at')
                ->first();
    
            // Materi terkait quiz = semua materi di kelas (by dosen)
            $totalRequiredMaterials = $allMaterials->count();
            $completedMaterials     = $allMaterials->filter(function ($m) use ($progressMap) {
                $p = $progressMap->get($m->id);
                return $p && $p->status === 'completed';
            })->count();
    
            $quizUnlocked = ($completedMaterials >= $totalRequiredMaterials);
    
            // Missing requirements
            $missingRequirements = [];
            if (!$quizUnlocked) {
                foreach ($allMaterials as $m) {
                    $p = $progressMap->get($m->id);
                    if (!$p || $p->status !== 'completed') {
                        $reason = (!$p || is_null($p->read_at))
                            ? 'Belum dibaca'
                            : 'Latihan soal belum tuntas';
    
                        $missingRequirements[] = [
                            'material_id' => $m->id,
                            'name'        => $m->material_name,
                            'reason'      => $reason,
                        ];
                    }
                }
            }
    
            $quizStatus = match(true) {
                $quizAttempt !== null => 'completed',
                $quizUnlocked         => 'available',
                default               => 'locked',
            };
    
            $quizData = [
                'id'                      => $quizRow->id,
                'title'                   => $quizRow->title,
                'status'                  => $quizStatus,
                'passing_score'           => $quizRow->passing_score,
                'required_material_count' => $totalRequiredMaterials,
                'missing_requirements'    => array_slice($missingRequirements, 0, 3),
            ];
    
            if ($quizUnlocked && !$quizAttempt) {
                $quizNextAction = [
                    'key'         => 'quiz',
                    'label'       => 'Kerjakan Quiz',
                    'title'       => 'Quiz sudah terbuka!',
                    'description' => 'Semua materi sudah tuntas. Saatnya kerjakan quiz!',
                    'href'        => route('quiz.show', $quizRow->id),
                    'disabled'    => false,
                ];
            } elseif (!$quizUnlocked) {
                $quizNextAction = [
                    'key'         => 'quiz_locked',
                    'label'       => 'Quiz Terkunci',
                    'title'       => 'Quiz belum bisa dikerjakan',
                    'description' => "Selesaikan semua materi dulu. Baru {$completedMaterials} dari {$totalRequiredMaterials} materi yang tuntas.",
                    'href'        => '#',
                    'disabled'    => true,
                ];
            }
        }
    
        // ── 7. Tentukan next_action utama ─────────────────────────────────────
        // Priority: ikuti next_action dari DB (LearningPathService) jika ada,
        // kalau tidak ada, derive dari status kolom.
        $derivedNextAction = $this->deriveNextAction(
            $nextAction,
            $isRead,
            $isPretestDone,
            $isPracticeDone,
            $isCompleted,
            $currentLevel,
            $currentMaterialRow,
            $nextMaterialRow,
            $quizNextAction
        );
    
        // ── 8. Quiz status untuk summary ─────────────────────────────────────
        $quizSummaryStatus = $quizData ? $quizData['status'] : 'locked';
    
        // ── 9. Overall progress % ─────────────────────────────────────────────
        $done  = $stats['materials_completed'] + $stats['practices_completed'] + $stats['quizzes_completed'];
        $total = $stats['total_materials'] + $stats['total_practices'] + $stats['total_quizzes'];
        $overallProgress = $total > 0 ? (int) round(($done / $total) * 100) : 0;
    
        // ── Hasil akhir ───────────────────────────────────────────────────────
        return [
            'has_class'        => true,
            'overall_progress' => $overallProgress,
            'current_material' => $currentMaterialRow ? [
                'id'            => $currentMaterialRow->id,
                'name'          => $currentMaterialRow->material_name,
                'current_level' => $currentLevel,
            ] : null,
            'next_material'    => $nextMaterialRow ? [
                'id'   => $nextMaterialRow->id,
                'name' => $nextMaterialRow->material_name,
            ] : null,
            'quiz'             => $quizData,
            'next_action'      => $derivedNextAction,
            'summary'          => [
                'active_material_name'  => $currentMaterialRow?->material_name ?? '-',
                'read_status'           => $readStatus,
                'practice_gate_status'  => $practiceGateStatus,
                'pretest_status'        => $pretestStatus,
                'level_practice_status' => $levelPracticeStatus,
                'next_material_status'  => $nextMaterialStatus,
                'quiz_status'           => $quizSummaryStatus,
            ],
        ];
    }
   

    private function deriveNextAction(
        ?string $dbNextAction,
        bool $isRead,
        bool $isPretestDone,
        bool $isPracticeDone,
        bool $isCompleted,
        ?string $currentLevel,
        $currentMaterial,
        $nextMaterial,
        ?array $quizNextAction
    ): array {
        $materialHref = $currentMaterial
            ? route('materials.show', $currentMaterial->slug ?? $currentMaterial->id)
            : '/materi';
    
        // Kalau quiz sudah siap, prioritaskan quiz
        if ($quizNextAction && !($quizNextAction['disabled'] ?? true)) {
            return $quizNextAction;
        }
    
        // Ikuti next_action dari DB (LearningPathService) jika ada dan masih relevan
        if ($dbNextAction) {
            $levelLabels = [
                'easy'   => 'Easy',
                'medium' => 'Medium',
                'hard'   => 'Hard',
            ];
    
            $levelLabel = $currentLevel ? ($levelLabels[$currentLevel] ?? strtoupper($currentLevel)) : '';
    
            $actionMap = [
                'read_material_again' => [
                    'key'         => 'repeat_material',
                    'label'       => 'Baca Ulang Materi',
                    'title'       => 'Perlu baca ulang materinya',
                    'description' => 'Kamu sudah 3x remedial. Baca ulang materi dulu sebelum latihan lagi ya.',
                    'href'        => $materialHref,
                    'disabled'    => false,
                ],
                'start_easy' => [
                    'key'         => 'level_practice',
                    'label'       => 'Mulai Latihan Easy',
                    'title'       => 'Latihan soal level Easy',
                    'description' => 'Pretest selesai! Level kamu Easy. Yuk mulai latihan soal.',
                    'href'        => route('practices.index', ['material' => $currentMaterial?->id, 'level' => 'easy']),
                    'disabled'    => false,
                ],
                'start_medium' => [
                    'key'         => 'level_practice',
                    'label'       => 'Mulai Latihan Medium',
                    'title'       => 'Latihan soal level Medium',
                    'description' => 'Pretest selesai! Level kamu Medium. Yuk mulai latihan soal.',
                    'href'        => route('practices.index', ['material' => $currentMaterial?->id, 'level' => 'medium']),
                    'disabled'    => false,
                ],
                'start_hard' => [
                    'key'         => 'level_practice',
                    'label'       => 'Mulai Latihan Hard',
                    'title'       => 'Latihan soal level Hard',
                    'description' => 'Pretest selesai! Level kamu Hard. Yuk mulai latihan soal.',
                    'href'        => route('practices.index', ['material' => $currentMaterial?->id, 'level' => 'hard']),
                    'disabled'    => false,
                ],
                'repeat_easy_subtopic' => [
                    'key'         => 'level_practice',
                    'label'       => 'Ulang Latihan Easy',
                    'title'       => 'Remedial latihan Easy',
                    'description' => 'Fokus pada subtopik yang lemah. Kamu pasti bisa!',
                    'href'        => route('practices.index', ['material' => $currentMaterial?->id, 'level' => 'easy']),
                    'disabled'    => false,
                ],
                'repeat_medium_subtopic' => [
                    'key'         => 'level_practice',
                    'label'       => 'Ulang Latihan Medium',
                    'title'       => 'Remedial latihan Medium',
                    'description' => 'Fokus pada subtopik yang lemah dulu ya.',
                    'href'        => route('practices.index', ['material' => $currentMaterial?->id, 'level' => 'medium']),
                    'disabled'    => false,
                ],
                'repeat_hard_subtopic' => [
                    'key'         => 'level_practice',
                    'label'       => 'Ulang Latihan Hard',
                    'title'       => 'Remedial latihan Hard',
                    'description' => 'Hampir! Fokus pada subtopik yang masih lemah.',
                    'href'        => route('practices.index', ['material' => $currentMaterial?->id, 'level' => 'hard']),
                    'disabled'    => false,
                ],
                'go_next_material' => [
                    'key'         => 'next_material',
                    'label'       => 'Buka Materi Berikutnya',
                    'title'       => 'Materi berikutnya sudah terbuka!',
                    'description' => $nextMaterial
                        ? "Yuk lanjut ke \"{$nextMaterial->material_name}\"."
                        : 'Semua materi sudah selesai!',
                    'href'        => $nextMaterial
                        ? route('materials.show', $nextMaterial->slug ?? $nextMaterial->id)
                        : '/materi',
                    'disabled'    => $nextMaterial === null,
                ],
            ];
    
            if (isset($actionMap[$dbNextAction])) {
                return $actionMap[$dbNextAction];
            }
        }
    
        // ── Fallback: derive dari flags ───────────────────────────────────────
        if ($isCompleted || $isPracticeDone) {
            return [
                'key'         => 'next_material',
                'label'       => $nextMaterial ? 'Buka Materi Berikutnya' : 'Semua Selesai!',
                'title'       => $nextMaterial ? 'Materi berikutnya sudah terbuka!' : 'Semua materi selesai!',
                'description' => $nextMaterial
                    ? "Yuk lanjut ke \"{$nextMaterial->material_name}\"."
                    : 'Mantap! Semua materi sudah tuntas.',
                'href'        => $nextMaterial
                    ? route('materials.show', $nextMaterial->slug ?? $nextMaterial->id)
                    : '/materi',
                'disabled'    => false,
            ];
        }
    
        if ($isPretestDone && $currentLevel) {
            $levelLabels = ['easy' => 'Easy', 'medium' => 'Medium', 'hard' => 'Hard'];
            $label       = $levelLabels[$currentLevel] ?? strtoupper($currentLevel);
    
            return [
                'key'         => 'level_practice',
                'label'       => "Mulai Latihan {$label}",
                'title'       => "Latihan soal level {$label}",
                'description' => "Pretest selesai! Level kamu {$label}. Yuk kerjakan latihan soalnya.",
                'href'        => route('practices.index', ['material' => $currentMaterial?->id, 'level' => $currentLevel]),
                'disabled'    => false,
            ];
        }
    
        if ($isRead) {
            return [
                'key'         => 'pretest',
                'label'       => 'Kerjakan Pretest',
                'title'       => 'Saatnya kerjakan Pretest!',
                'description' => 'Materi sudah dibaca. Kerjakan pretest untuk menentukan level latihan yang sesuai.',
                'href'        => route('practices.attempts.entry', $currentMaterial?->id),
                'disabled'    => false,
            ];
        }
    
        // Belum baca materi sama sekali
        return [
            'key'         => 'read_material',
            'label'       => 'Mulai Baca Materi',
            'title'       => 'Mulai dari membaca materi',
            'description' => 'Baca materi dulu agar kamu paham konsep dasarnya sebelum latihan soal.',
            'href'        => $materialHref,
            'disabled'    => false,
        ];
    }
    
   
    private function emptyLearningPath(array $stats): array
    {
        $done  = $stats['materials_completed'] + $stats['practices_completed'] + $stats['quizzes_completed'];
        $total = $stats['total_materials'] + $stats['total_practices'] + $stats['total_quizzes'];
    
        return [
            'has_class'        => false,
            'overall_progress' => $total > 0 ? (int) round(($done / $total) * 100) : 0,
            'current_material' => null,
            'next_material'    => null,
            'quiz'             => null,
            'next_action'      => [
                'key'         => 'join_class',
                'label'       => 'Kelas belum terhubung',
                'title'       => 'Hubungkan kelas untuk mulai belajar',
                'description' => 'Dashboard belajar akan aktif setelah akunmu tergabung ke kelas.',
                'href'        => '#',
                'disabled'    => true,
            ],
            'summary'          => [
                'active_material_name'  => '-',
                'read_status'           => 'locked',
                'practice_gate_status'  => 'locked',
                'pretest_status'        => 'locked',
                'level_practice_status' => 'locked',
                'next_material_status'  => 'locked',
                'quiz_status'           => 'locked',
            ],
        ];
    }


    /**
     * Dashboard untuk DOSEN
     */
    protected function dosenDashboard()
    {
        $user = Auth::user();

        // Get classes created by this dosen
        $classes = DB::table('classes as c')
            ->where('c.created_by', $user->id)
            ->select(['c.id', 'c.class_name', 'c.class_code', 'c.created_at'])
            ->get();

        $classIds = $classes->pluck('id');

        // Stats cards
        $totalClasses = $classes->count();

        $totalStudents = DB::table('class_user as cu')
            ->join('users as u', 'u.id', '=', 'cu.user_id')
            ->whereIn('cu.class_id', $classIds)
            ->where('u.role', 'mahasiswa')
            ->distinct('cu.user_id')
            ->count('cu.user_id');

        $totalMaterials = MaterialModel::where('created_by', $user->id)->count();

        $totalQuizzes = QuizModel::whereIn('class_id', $classIds)->count();

        $stats = [
            'total_classes' => $totalClasses,
            'total_students' => $totalStudents,
            'total_materials' => $totalMaterials,
            'total_quizzes' => $totalQuizzes,
        ];

        // Recent activities (latest quiz attempts from students in this dosen's classes)
        $recentActivities = DB::table('quiz_attempts as qa')
            ->join('users as u', 'qa.user_id', '=', 'u.id')
            ->join('quizzes as q', 'qa.quizzes_id', '=', 'q.id')
            ->whereIn('q.class_id', $classIds)
            ->whereNotNull('qa.finished_at')
            ->select([
                'u.nama as student_name',
                'q.title as quiz_title',
                'qa.total_score',
                'qa.finished_at',
            ])
            ->orderBy('qa.finished_at', 'desc')
            ->limit(5)
            ->get();

        // Top students (by total quiz points in this dosen's classes)
        $topStudents = DB::table('class_user as cu')
            ->join('users as u', 'u.id', '=', 'cu.user_id')
            ->leftJoin('quiz_attempts as qa', 'qa.user_id', '=', 'u.id')
            ->leftJoin('quizzes as q', function ($join) use ($classIds) {
                $join->on('q.id', '=', 'qa.quizzes_id')
                    ->whereIn('q.class_id', $classIds);
            })
            ->whereIn('cu.class_id', $classIds)
            ->where('u.role', 'mahasiswa')
            ->whereNotNull('qa.finished_at')
            ->select([
                'u.id',
                'u.nama as name',
                DB::raw('COALESCE(SUM(qa.total_score), 0) as total_points'),
            ])
            ->groupBy('u.id', 'u.nama')
            ->orderBy('total_points', 'desc')
            ->limit(5)
            ->get();

        return Inertia::render('Dosen/Dashboard', [
            'stats' => $stats,
            'classes' => $classes,
            'recentActivities' => $recentActivities,
            'topStudents' => $topStudents,
        ]);
    }

    /**
     * Dashboard untuk SUPERADMIN
     */
    protected function superadminDashboard()
    {
        // Overall system stats
        $stats = [
            'total_users' => UserModel::count(),
            'total_students' => UserModel::where('role', 'mahasiswa')->count(),
            'total_teachers' => UserModel::where('role', 'dosen')->count(),
            'total_classes' => DB::table('classes')->count(),
            'total_materials' => MaterialModel::count(),
            'total_exercises' => PracticeModel::count(),
            'total_quizzes' => QuizModel::count(),
        ];

        // User breakdown by role
        $usersByRole = UserModel::select('role', DB::raw('count(*) as count'))
            ->groupBy('role')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->role => $item->count];
            });

        // Recent registered users
        $recentUsers = UserModel::select(['id', 'nama as name', 'email', 'role', 'created_at'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // System activity (latest quiz attempts across all classes)
        $recentActivities = DB::table('quiz_attempts as qa')
            ->join('users as u', 'qa.user_id', '=', 'u.id')
            ->join('quizzes as q', 'qa.quizzes_id', '=', 'q.id')
            ->whereNotNull('qa.finished_at')
            ->select([
                'u.nama as student_name',
                'q.title as quiz_title',
                'qa.total_score',
                'qa.finished_at',
            ])
            ->orderBy('qa.finished_at', 'desc')
            ->limit(10)
            ->get();

        return Inertia::render('SuperAdmin/Dashboard', [
            'stats' => $stats,
            'usersByRole' => $usersByRole,
            'recentUsers' => $recentUsers,
            'recentActivities' => $recentActivities,
        ]);
    }
}