<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\MaterialModel;
use App\Models\PracticeModel;
use App\Models\QuizModel;
use App\Models\User;
use App\Models\ClassModel; // Sesuaikan dengan nama model Class kamu
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Handle dashboard redirect based on user role
     */
    public function index()
    {
        $user = auth()->user();

        // Redirect based on role
        if ($user->hasRole('tamu')) {
            return $this->tamuDashboard();
        }

        if ($user->hasRole('mahasiswa')) {
            return $this->mahasiswaDashboard();
        }

        if ($user->hasRole('dosen')) {
            return $this->dosenDashboard();
        }

        if ($user->hasRole('superadmin')) {
            return $this->adminDashboard();
        }

        // Fallback
        abort(403, 'Unauthorized role');
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
    protected function mahasiswaDashboard()
    {
        $user = auth()->user();
        
        // Check if user has joined a class
        $hasClass = $user->class_id !== null;

        // Get stats
        $stats = [
            'materials_completed' => 0,
            'total_materials' => MaterialModel::count(),
            'practices_completed' => 0,
            'quizzes_completed' => 0,
            'total_quizzes' => QuizModel::count(),
            'total_points' => 0,
        ];

        $recommendations = [];

        if ($hasClass) {
            // Materials completed (based on progress table)
            $stats['materials_completed'] = DB::table('user_material_progress')
                ->where('user_id', $user->id)
                ->where('is_completed', true)
                ->count();

            // Practice attempts completed
            $stats['practices_completed'] = DB::table('practice_attempts')
                ->where('user_id', $user->id)
                ->where('is_finished', true)
                ->distinct('practice_id')
                ->count('practice_id');

            // Quiz attempts completed
            $stats['quizzes_completed'] = DB::table('quiz_attempts')
                ->where('user_id', $user->id)
                ->where('is_finished', true)
                ->count();

            // Total points (practice + quiz scores)
            $practicePoints = DB::table('practice_attempts')
                ->where('user_id', $user->id)
                ->where('is_finished', true)
                ->sum('score');

            $quizPoints = DB::table('quiz_attempts')
                ->where('user_id', $user->id)
                ->where('is_finished', true)
                ->sum('total_score');

            $stats['total_points'] = $practicePoints + $quizPoints;

            // Get recommendations (materials that need review based on quiz scores)
            $recommendations = DB::table('recommendations')
                ->join('materials', 'recommendations.material_id', '=', 'materials.id')
                ->where('recommendations.user_id', $user->id)
                ->where('recommendations.is_completed', false)
                ->select([
                    'recommendations.id',
                    'recommendations.score',
                    'recommendations.created_at',
                    'materials.id as material_id',
                    'materials.title as material_title',
                ])
                ->orderBy('recommendations.created_at', 'desc')
                ->limit(3)
                ->get()
                ->map(function ($rec) {
                    return [
                        'id' => $rec->id,
                        'score' => $rec->score,
                        'material' => [
                            'id' => $rec->material_id,
                            'title' => $rec->material_title,
                        ],
                    ];
                });
        }

        return Inertia::render('Mahasiswa/Dashboard', [
            'stats' => $stats,
            'recommendations' => $recommendations,
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
            ->join('quizzes', 'quiz_attempts.quiz_id', '=', 'quizzes.id')
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
            ->join('quizzes', 'quiz_attempts.quiz_id', '=', 'quizzes.id')
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