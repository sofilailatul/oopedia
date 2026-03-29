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
            'total_quizzes' => 0,

            'avg_quiz_score' => null,
            'total_time_spent_seconds' => 0,

            'total_points' => 0,

            'practice_by_difficulty' => [],
            'all_difficulty_completed' => false,
        ];

        $recommendations = [];
        $recentActivities = [];

        /* =====================================================
        * QUIZ (ikut kelas jika ada)
        * ===================================================== */
        if ($hasClass) {
            $quizBase = DB::table('quiz_attempts as qa')
                ->join('quizzes as q', 'q.id', '=', 'qa.quizzes_id')
                ->where('qa.user_id', $userId)
                ->where('q.class_id', $classId)
                ->whereNotNull('qa.finished_at');

            $stats['quizzes_completed'] = $quizBase->count();
            $avg = $quizBase->avg('qa.total_score');

            $stats['total_quizzes'] = QuizModel::where('class_id', $classId)->count();
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
            $dosenId = DB::table('classes')->where('id', $classId)->value('created_by');

            // MATERIAL selesai jika sudah dibaca (read_at tidak null) untuk kelas tersebut
            $stats['materials_completed'] = DB::table('user_progress')
                ->where('user_id', $userId)
                ->where('class_id', $classId)
                ->whereNotNull('read_at')
                ->count();

            // total materials global, di filter by dosen pembuat kelas
            if ($dosenId) {
                $stats['total_materials'] = DB::table('materials')->where('created_by', $dosenId)->count();
            } else {
                $stats['total_materials'] = DB::table('materials')->count();
            }
        } else {
            // kalau belum join kelas tetap boleh tampil total materials (opsional) 0
            $stats['total_materials'] = 0;
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
    protected function adminDashboard()
    {
        // Overall system stats
        $stats = [
            'total_users' => UserModel::count(),
            'total_students' => UserModel::where('role', 'mahasiswa')->count(),
            'total_teachers' => UserModel::where('role', 'dosen')->count(),
            'total_classes' => DB::table('classes')->count(),
            'total_materials' => MaterialModel::count(),
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