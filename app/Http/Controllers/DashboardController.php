<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\MaterialModel;
use App\Models\PracticeModel;
use App\Models\QuizModel;
use App\Models\User;
use App\Models\ClassModel; 
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

            'dosen' => Inertia::render('Dosen/Dashboard'),

            'superadmin' => Inertia::render('SuperAdmin/Dashboard'),

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
        $userId = $user->id;

        // ambil class_id dari pivot class_user (ambil kelas pertama)
        $classId = DB::table('class_user')
            ->where('user_id', $userId)
            ->value('class_id');

        $hasClass = !is_null($classId);

        $stats = [
            'materials_completed' => 0,
            'total_materials' => 0,

            // practice dihitung PER MATERI
            'practices_completed' => 0,
            'total_practices' => 0,

            'quizzes_completed' => 0,
            'total_quizzes' => QuizModel::count(),

            'avg_quiz_score' => null,
            'total_time_spent_seconds' => 0,

            'total_points' => 0,

            'practice_by_difficulty' => [],
            'all_difficulty_completed' => false,
        ];

        $recommendations = [];
        $recentActivities = [];

        /* =====================================================
        * QUIZ (tidak tergantung kelas)
        * ===================================================== */
        $stats['quizzes_completed'] = DB::table('quiz_attempts')
            ->where('user_id', $userId)
            ->whereNotNull('finished_at')
            ->count();

        $avg = DB::table('quiz_attempts')
            ->where('user_id', $userId)
            ->whereNotNull('finished_at')
            ->avg('total_score');

        $stats['avg_quiz_score'] = $avg !== null ? round($avg, 1) : null;

        /* =====================================================
        * POINTS (tidak tergantung kelas)
        * ===================================================== */
        $practicePoints = DB::table('practice_attempts')
            ->where('user_id', $userId)
            ->whereNotNull('finished_at')
            ->sum('final_score');

        $quizPoints = DB::table('quiz_attempts')
            ->where('user_id', $userId)
            ->whereNotNull('finished_at')
            ->sum('total_score');

        $stats['total_points'] = (int)$practicePoints + (int)$quizPoints;

        /* =====================================================
        * TOTAL TIME (optional)
        * ===================================================== */
        try {
            $stats['total_time_spent_seconds'] = (int) DB::table('study_sessions')
                ->where('user_id', $userId)
                ->sum('duration_seconds');
        } catch (\Throwable $e) {
            $stats['total_time_spent_seconds'] = 0;
        }

        /* =====================================================
        * YANG BUTUH KELAS (progress material & rekomendasi)
        * ===================================================== */
        if ($hasClass) {
            // MATERIAL selesai jika status unlocked (progress per kelas)
            $stats['materials_completed'] = DB::table('user_progress')
                ->where('user_id', $userId)
                ->where('class_id', $classId)
                ->where('status', 'unlocked')
                ->count();

            // total materials global
            $stats['total_materials'] = DB::table('materials')->count();
        } else {
            // kalau belum join kelas tetap boleh tampil total materials (opsional)
            $stats['total_materials'] = DB::table('materials')->count();
        }

        /* =====================================================
        * PRACTICE GLOBAL (karena materials/practices sama semua kelas)
        * 1 materi selesai jika semua difficulty_level selesai
        * ===================================================== */
        // total materi yang punya practice
        $stats['total_practices'] = DB::table('practices')
            ->distinct()
            ->count('material_id');

        // materi complete semua level (ONLY_FULL_GROUP_BY safe)
        $stats['practices_completed'] = DB::table('practices as p')
            ->leftJoin('practice_attempts as pa', function ($join) use ($userId) {
                $join->on('pa.practices_id', '=', 'p.id')
                    ->where('pa.user_id', '=', $userId)
                    ->whereNotNull('pa.finished_at');
            })
            ->selectRaw('p.material_id')
            ->groupBy('p.material_id')
            ->havingRaw(
                'COUNT(DISTINCT p.difficulty_level) =
                COUNT(DISTINCT CASE WHEN pa.practices_id IS NOT NULL THEN p.difficulty_level END)'
            )
            ->get()
            ->count();

        // progress per difficulty_level
        $practiceByDifficulty = DB::table('practices as p')
            ->leftJoin('practice_attempts as pa', function ($join) use ($userId) {
                $join->on('pa.practices_id', '=', 'p.id')
                    ->where('pa.user_id', '=', $userId)
                    ->whereNotNull('pa.finished_at');
            })
            ->selectRaw('p.difficulty_level, COUNT(DISTINCT p.id) as total, COUNT(DISTINCT pa.practices_id) as completed')
            ->groupBy('p.difficulty_level')
            ->get();

        $stats['practice_by_difficulty'] = $practiceByDifficulty;

        $stats['all_difficulty_completed'] = $practiceByDifficulty->isNotEmpty()
            ? $practiceByDifficulty->every(fn ($row) => (int)$row->total > 0 && (int)$row->completed >= (int)$row->total)
            : false;

        return Inertia::render('Mahasiswa/Dashboard', [
            'auth' => [
                'user' => $user,
            ],
            'stats' => $stats,
            'recommendations' => $recommendations,
            'recentActivities' => $recentActivities,
            'hasClass' => $hasClass,
        ]);
    }



    /**
     * Dashboard untuk DOSEN
     */
    protected function dosenDashboard()
    {
        $user = auth()->user();

        // Get dosen's classes
        $classes = DB::table('classes')
            ->where('teacher_id', $user->id)
            ->select(['id', 'name', 'class_code', 'created_at'])
            ->get();

        $classIds = $classes->pluck('id');

        // Stats
        $stats = [
            'total_classes' => $classes->count(),
            'total_students' => DB::table('users')
                ->whereIn('class_id', $classIds)
                ->where('role', 'mahasiswa')
                ->count(),
            'total_materials' => Material::whereIn('class_id', $classIds)->count(),
            'total_quizzes' => Quiz::whereIn('class_id', $classIds)->count(),
        ];

        // Recent activities (latest quiz attempts from students)
        $recentActivities = DB::table('quiz_attempts')
            ->join('users', 'quiz_attempts.user_id', '=', 'users.id')
            ->join('quizzes', 'quiz_attempts.quizzes_id', '=', 'quizzes.id')
            ->whereIn('quizzes.class_id', $classIds)
            ->where('quiz_attempts.is_finished', true)
            ->select([
                'users.name as student_name',
                'quizzes.title as quiz_title',
                'quiz_attempts.total_score',
                'quiz_attempts.finished_at',
            ])
            ->orderBy('quiz_attempts.finished_at', 'desc')
            ->limit(5)
            ->get();

        // Top students (by total points in dosen's classes)
        $topStudents = DB::table('users')
            ->whereIn('class_id', $classIds)
            ->where('role', 'mahasiswa')
            ->select([
                'users.id',
                'users.name',
                DB::raw('COALESCE(SUM(quiz_attempts.total_score), 0) as total_points')
            ])
            ->leftJoin('quiz_attempts', function($join) {
                $join->on('users.id', '=', 'quiz_attempts.user_id')
                    ->where('quiz_attempts.is_finished', true);
            })
            ->groupBy('users.id', 'users.name')
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
    protected function adminDashboard()
    {
        // Overall system stats
        $stats = [
            'total_users' => User::count(),
            'total_students' => User::where('role', 'mahasiswa')->count(),
            'total_teachers' => User::where('role', 'dosen')->count(),
            'total_classes' => DB::table('classes')->count(),
            'total_materials' => Material::count(),
            'total_quizzes' => Quiz::count(),
        ];

        // User breakdown by role
        $usersByRole = User::select('role', DB::raw('count(*) as count'))
            ->groupBy('role')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->role => $item->count];
            });

        // Recent registered users
        $recentUsers = User::select(['id', 'name', 'email', 'role', 'created_at'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // System activity (latest quiz attempts across all classes)
        $recentActivities = DB::table('quiz_attempts')
            ->join('users', 'quiz_attempts.user_id', '=', 'users.id')
            ->join('quizzes', 'quiz_attempts.quizzes_id', '=', 'quizzes.id')
            ->where('quiz_attempts.is_finished', true)
            ->select([
                'users.name as student_name',
                'quizzes.title as quiz_title',
                'quiz_attempts.total_score',
                'quiz_attempts.finished_at',
            ])
            ->orderBy('quiz_attempts.finished_at', 'desc')
            ->limit(10)
            ->get();

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'usersByRole' => $usersByRole,
            'recentUsers' => $recentUsers,
            'recentActivities' => $recentActivities,
        ]);
    }
}