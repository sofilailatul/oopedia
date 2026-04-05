<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ClassController;
use App\Http\Controllers\MaterialController;
use App\Http\Controllers\PracticeController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\RecommendationController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\ProgressController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DashboardController;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
}) ->name('welcome');

Route::get('/ping', fn () => response()->json(['ok' => true]))->name('ping');

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth'])
    ->name('dashboard');


Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

/*
|--------------------------------------------------------------------------
| Auth routes (Breeze) - SESSION BASED
|--------------------------------------------------------------------------
*/
require __DIR__.'/auth.php';

Route::middleware('auth')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | MATERI 
    |--------------------------------------------------------------------------
    */
    Route::get('/materi', [MaterialController::class, 'IndexMahasiswa'])->name('materials.index');
    Route::get('/materi/{material}', [MaterialController::class, 'show'])->name('materials.show');
    Route::post('/materi/{material}/finish-read',[MaterialController::class, 'finishRead']);
    Route::get('/materi/{material}/finish-read', function () {
        abort(405, 'Finish-read hanya boleh POST');
    });

    /*
    |--------------------------------------------------------------------------
    | PRACTICE 
    |--------------------------------------------------------------------------
    */
    Route::get('/daftar-latihan-soal', [PracticeController::class, 'index'])
        ->name('practices.index');
    Route::post('/latihan-soal/{practice}/attempts', [PracticeController::class, 'startAttempt'])
        ->name('practices.attempts.start');
    Route::get('/latihan-soal-attempts/{attempt}', [PracticeController::class, 'attemptDetail'])
        ->name('practice_attempts.show');
    Route::post('/latihan-soal-attempts/{attempt}/answers', [PracticeController::class, 'submitAnswers'])
        ->name('practice_attempts.answers');
    Route::get('/latihan-soal/{practice}/summary', [PracticeController::class, 'summary'])
        ->name('practices.summary');
    /*
    |--------------------------------------------------------------------------
    | TAMU (register tapi belum join kelas)
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:tamu')->group(function () {
        Route::post('/classes/join', [ClassController::class, 'join'])->name('classes.join');
    });

    /*
    |--------------------------------------------------------------------------
    | MAHASISWA
    |--------------------------------------------------------------------------
    */
    Route::middleware('auth','role:mahasiswa')->group(function () {

        // PROGRESS
        Route::get('/progress', [ProgressController::class, 'myProgress'])->name('progress.me');

        // QUIZ
        Route::get('/kuis', [QuizController::class, 'index'])->name('quizzes.index');
        Route::get('/quizzes/{quiz}', [QuizController::class, 'show'])->name('quizzes.show');
        Route::get('/quizzes/{quiz}/questions', [QuizController::class, 'questions'])->name('quizzes.questions');
        Route::post('/quizzes/{quiz}/attempts', [QuizController::class, 'startAttempt'])->name('quizzes.attempts.start');
        Route::get('/quiz-attempts/{attempt}', [QuizController::class, 'attemptShow'])->name('quiz_attempts.show');
        Route::post('/quiz-attempts/{attempt}/answers', [QuizController::class, 'submitAnswers'])->name('quiz_attempts.answers');
        Route::post('/quiz-attempts/{attempt}/check-answer', [QuizController::class, 'checkAnswer'])->name('quiz_attempts.check_answer');
        Route::get('/quiz-attempts/{attempt}/review',[QuizController::class, 'review'])->name('quizzes.review');
        Route::get('/quiz-attempts/{attempt}/completed', [QuizController::class, 'completed']) ->name('quiz_attempts.completed');

        // RECOMMENDATION
        Route::get('/recommendations', [RecommendationController::class, 'myRecommendations'])->name('recommendations.me');
        Route::post('/recommendations/{recommendation}/complete', [RecommendationController::class, 'markCompleted'])->name('recommendations.complete');

    });

    // LEADERBOARD (mahasiswa + dosen)
    Route::middleware('auth', 'role:mahasiswa')->prefix('leaderboard')->name('leaderboard.')->group(function () {
        Route::get('/practice', [LeaderboardController::class, 'practice'])->name('practice');
        Route::get('/quiz', [LeaderboardController::class, 'quiz'])->name('quiz');
        Route::get('/index', [LeaderboardController::class, 'combined'])->name('combined');
    });

    /*
    |--------------------------------------------------------------------------
    | DOSEN
    |--------------------------------------------------------------------------
    */
    Route::middleware('auth','role:dosen')->group(function () {

        // ===== NILAI MAHASISWA (dosen) =====
        Route::get('/dosen/nilai-mahasiswa', [ProgressController::class, 'dosenClassScoresPage'])
            ->name('dosen.grades.index');
        Route::get('/dosen/nilai-mahasiswa/{student}', [ProgressController::class, 'dosenStudentDetailPage'])
            ->name('dosen.grades.show');

        // ===== PRACTICE (dosen) =====
        Route::get('/dosen/latihan-soal', [PracticeController::class, 'dosenIndexPage'])
            ->name('dosen.practices.index');
        Route::get('/dosen/latihan-soal/{practice}/show', [PracticeController::class, 'dosenShowPage'])
            ->name('dosen.practices.show');
        Route::get('/dosen/latihan-soal/{practice}/create', [PracticeController::class, 'dosenCreatePage'])
            ->name('dosen.practices.create');
        Route::get('/dosen/latihan-soal/{practice}', [PracticeController::class, 'dosenEditPage'])
            ->name('dosen.practices.edit');
        Route::post('/dosen/latihan-soal/{practice}/questions', [PracticeController::class, 'dosenSaveQuestions'])
            ->name('dosen.practices.questions.save');

        // ===== QUIZZES (dosen) =====
        Route::get('/dosen/kuis', [QuizController::class, 'dosenIndexPage'])
            ->name('dosen.quizzes.index');
        Route::get('/dosen/kuis/create', [QuizController::class, 'dosenCreatePage'])
            ->name('dosen.quizzes.create');
        Route::get('/dosen/kuis/{quiz}/show', [QuizController::class, 'dosenShowPage'])
            ->name('dosen.quizzes.show');
        Route::get('/dosen/kuis/{quiz}/edit', [QuizController::class, 'dosenEditPage'])
            ->name('dosen.quizzes.edit');
        Route::post('/dosen/kuis/{quiz}/questions', [QuizController::class, 'dosenSaveQuestions'])
            ->name('dosen.quizzes.questions.save');
        Route::post('/dosen/kuis/{quiz}/duplicate', [QuizController::class, 'duplicateToClasses'])
            ->name('dosen.quizzes.duplicate');

        // ===== MATERI (dosen) =====
        Route::prefix('dosen/materi')->name('dosen.materials.')->group(function () {
            Route::get('/', [MaterialController::class, 'manageIndex'])->name('index');
            Route::put('/reorder', [MaterialController::class, 'reorderMaterials'])->name('reorder');
            Route::get('/create', [MaterialController::class, 'manageCreate'])->name('create');
            Route::get('/{material}/show', [MaterialController::class, 'manageShow'])->name('show');
            Route::get('/{material}/edit', [MaterialController::class, 'manageEdit'])->name('edit');
            Route::post('/', [MaterialController::class, 'manageStore'])->name('store');
            Route::put('/{material}', [MaterialController::class, 'manageUpdate'])->name('update');
        });

        // ===== KELAS (halaman ManageClasses untuk dosen) =====
        Route::get('/dosen/kelas', [ClassController::class, 'manageIndex'])->name('dosen.classes.index');

        // ===== PRACTICE =====
        Route::post('/practices', [PracticeController::class, 'store'])->name('practices.store');
        Route::put('/practices/{practice}', [PracticeController::class, 'update'])->name('practices.update');
        Route::delete('/practices/{practice}', [PracticeController::class, 'destroy'])->name('practices.destroy');

        Route::post('/practice-questions/{question}/image', [PracticeController::class, 'uploadQuestionImage'])->name('practice_questions.image.upload');
        Route::delete('/practice-questions/{question}/image', [PracticeController::class, 'deleteQuestionImage'])->name('practice_questions.image.delete');

        // ===== QUIZ =====
        Route::post('/quizzes', [QuizController::class, 'store'])->name('quizzes.store');
        Route::put('/quizzes/{quiz}', [QuizController::class, 'update'])->name('quizzes.update');
        Route::delete('/quizzes/{quiz}', [QuizController::class, 'destroy'])->name('quizzes.destroy');

        // bank soal quiz
        Route::post('/quiz-questions', [QuizController::class, 'questionStore'])->name('quiz_questions.store');
        Route::put('/quiz-questions/{question}', [QuizController::class, 'questionUpdate'])->name('quiz_questions.update');
        Route::delete('/quiz-questions/{question}', [QuizController::class, 'questionDestroy'])->name('quiz_questions.destroy');

        Route::post('/quiz-questions/{question}/image', [QuizController::class, 'uploadQuestionImage'])->name('quiz_questions.image.upload');
        Route::delete('/quiz-questions/{question}/image', [QuizController::class, 'deleteQuestionImage'])->name('quiz_questions.image.delete');

        // quiz map + points
        Route::post('/quizzes/{quiz}/map', [QuizController::class, 'mapAttach'])->name('quizzes.map.attach');
        Route::put('/quizzes/{quiz}/map/{question}', [QuizController::class, 'mapUpdate'])->name('quizzes.map.update');
        Route::delete('/quizzes/{quiz}/map/{question}', [QuizController::class, 'mapDetach'])->name('quizzes.map.detach');

    });

    // API kelas (dipakai di halaman ManageClasses) untuk dosen & superadmin
    Route::middleware('auth','role:dosen,superadmin')->group(function () {
        Route::get('/classes/{class}', [ClassController::class, 'show'])->name('classes.show');
        Route::post('/classes', [ClassController::class, 'store'])->name('classes.store');
        Route::put('/classes/{class}', [ClassController::class, 'update'])->name('classes.update');
        Route::delete('/classes/{class}', [ClassController::class, 'destroy'])->name('classes.destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | SUPERADMIN (semua route admin digabung di sini)
    |--------------------------------------------------------------------------
    */
    Route::middleware('auth','role:superadmin')->group(function () {


    // Kelola User (superadmin)
        Route::get('/users', [UserController::class, 'index'])->name('superadmin.users.index');
        Route::get('/users/create', [UserController::class, 'create'])->name('superadmin.users.create');
        Route::get('/users/{user}', [UserController::class, 'show'])->name('superadmin.users.show');
        Route::get('/users/{user}/edit', [UserController::class, 'edit'])->name('superadmin.users.edit');
        Route::post('/users', [UserController::class, 'store'])->name('superadmin.users.store');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('superadmin.users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('superadmin.users.destroy');
        Route::put('/users/{user}/role', [UserController::class, 'updateRole'])->name('superadmin.users.role');

        // Leaderboard (superadmin)
        Route::prefix('leaderboard')->name('leaderboard.')->group(function () {
            Route::get('/practice', [LeaderboardController::class, 'practice'])->name('practice');
            Route::get('/quiz', [LeaderboardController::class, 'quiz'])->name('quiz');
            Route::get('/combined', [LeaderboardController::class, 'combined'])->name('combined');
        });

        // Kelola Materi (superadmin) -> gunakan halaman ManageMaterial dengan method controller yang sama dg dosen
        Route::prefix('superadmin/materials')->name('superadmin.materials.')->group(function () {
            Route::get('/', [MaterialController::class, 'manageIndex'])->name('index');
            Route::put('/reorder', [MaterialController::class, 'reorderMaterials'])->name('reorder');
            Route::get('/create', [MaterialController::class, 'manageCreate'])->name('create');
            Route::get('/{material}/show', [MaterialController::class, 'manageShow'])->name('show');
            Route::get('/{material}/edit', [MaterialController::class, 'manageEdit'])->name('edit');
            Route::post('/', [MaterialController::class, 'manageStore'])->name('store');
            Route::put('/{material}', [MaterialController::class, 'manageUpdate'])->name('update');
        });

        // ===== KELAS (halaman ManageClasses untuk superadmin) =====
        Route::get('/superadmin/kelas', [ClassController::class, 'manageIndex'])->name('superadmin.classes.index');

        // Kelola Latihan Soal (superadmin) -> gunakan halaman ManagePractices (method sama dg dosen)
        Route::get('/superadmin/latihan-soal', [PracticeController::class, 'dosenIndexPage'])
            ->name('superadmin.practices.index');

        Route::get('/superadmin/latihan-soal/{practice}/show', [PracticeController::class, 'dosenShowPage'])
            ->name('superadmin.practices.show');
        Route::get('/superadmin/latihan-soal/{practice}/create', [PracticeController::class, 'dosenCreatePage'])
            ->name('superadmin.practices.create');
        Route::get('/superadmin/latihan-soal/{practice}', [PracticeController::class, 'dosenEditPage'])
            ->name('superadmin.practices.edit');

        // Simpan soal latihan (superadmin) menggunakan method yang sama dengan dosen
        Route::post('/superadmin/latihan-soal/{practice}/questions', [PracticeController::class, 'dosenSaveQuestions'])
            ->name('superadmin.practices.questions.save');

        // Kelola Kuis (superadmin) -> gunakan halaman ManageQuizzes
        Route::prefix('superadmin/kuis')->name('superadmin.quizzes.')->group(function () {
            Route::get('/', [QuizController::class, 'dosenIndexPage'])->name('index');
            Route::get('/create', [QuizController::class, 'dosenCreatePage'])->name('create');
            Route::get('/{quiz}/show', [QuizController::class, 'dosenShowPage'])->name('show');
            Route::get('/{quiz}/edit', [QuizController::class, 'dosenEditPage'])->name('edit');
            Route::post('/', [QuizController::class, 'store'])->name('store');
            Route::post('/{quiz}/questions', [QuizController::class, 'dosenSaveQuestions'])->name('questions.save');
            Route::post('/{quiz}/duplicate', [QuizController::class, 'duplicateToClasses'])->name('duplicate');
            Route::delete('/{quiz}', [QuizController::class, 'destroy'])->name('destroy');
        });

        // Nilai Mahasiswa (superadmin) -> gunakan halaman ManageLeaderboard
        Route::get('/superadmin/nilai-mahasiswa', [ProgressController::class, 'dosenClassScoresPage'])
            ->name('grades.index');
        Route::get('/superadmin/nilai-mahasiswa/{student}', [ProgressController::class, 'dosenStudentDetailPage'])
            ->name('grades.show');

        // Kelola Kelas (superadmin) -> gunakan halaman ManageClasses (method sama dg dosen)
        Route::get('/superadmin/kelas', [ClassController::class, 'manageIndex'])
            ->name('classes.index');
    });
});