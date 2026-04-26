<?php

use App\Http\Controllers\ClassController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Dosen\MaterialController as DosenMaterialController;
use App\Http\Controllers\Dosen\PracticeController as DosenPracticeController;
use App\Http\Controllers\Dosen\QuizController as DosenQuizController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\Mahasiswa\MaterialController as MahasiswaMaterialController;
use App\Http\Controllers\Mahasiswa\PracticeController as MahasiswaPracticeController;
use App\Http\Controllers\Mahasiswa\QuizController as MahasiswaQuizController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProgressController;
use App\Http\Controllers\RecommendationController;
use App\Http\Controllers\UserController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
})->name('welcome');

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
    Route::get('/materi', [MahasiswaMaterialController::class, 'IndexMahasiswa'])->name('materials.index');
    Route::get('/materi/{material}', [MahasiswaMaterialController::class, 'show'])->name('materials.show');
    Route::post('/materi/{material}/finish-read', [MahasiswaMaterialController::class, 'finishRead']);
    Route::get('/materi/{material}/finish-read', function () {
        abort(405, 'Finish-read hanya boleh POST');
    });

    /*
    |--------------------------------------------------------------------------
    | PRACTICE 
    |--------------------------------------------------------------------------
    */
    Route::get('/daftar-latihan-soal', [MahasiswaPracticeController::class, 'index'])
        ->name('practices.index');
    Route::post('/latihan-soal/{material}/attempts', [MahasiswaPracticeController::class, 'entry'])
        ->name('practices.attempts.entry');
    Route::get('/latihan-soal-attempts/{attempt}', [MahasiswaPracticeController::class, 'attemptDetail'])
        ->name('practices.attempts.show');
    Route::post('/latihan-soal-attempts/{attempt}/submit', [MahasiswaPracticeController::class, 'submitAnswers'])
        ->name('practices.attempts.submit');
    Route::get('/latihan-soal/{practice}/summary', [MahasiswaPracticeController::class, 'summary'])
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
    Route::middleware('role:mahasiswa')->group(function () {

        // PROGRESS
        Route::get('/progress', [ProgressController::class, 'myProgress'])->name('progress.me');

        // QUIZ
        Route::get('/kuis', [MahasiswaQuizController::class, 'index'])->name('quizzes.index');
        Route::get('/quizzes/{quiz}', [MahasiswaQuizController::class, 'show'])->name('quizzes.show');
        Route::get('/quizzes/{quiz}/questions', [MahasiswaQuizController::class, 'questions'])->name('quizzes.questions');
        Route::post('/quizzes/{quiz}/attempts', [MahasiswaQuizController::class, 'startAttempt'])->name('quizzes.attempts.start');
        Route::get('/quiz-attempts/{attempt}', [MahasiswaQuizController::class, 'attemptShow'])->name('quiz_attempts.show');
        Route::post('/quiz-attempts/{attempt}/answers', [MahasiswaQuizController::class, 'submitAnswers'])->name('quiz_attempts.answers');
        Route::post('/quiz-attempts/{attempt}/check-answer', [MahasiswaQuizController::class, 'checkAnswer'])->name('quiz_attempts.check_answer');
        Route::get('/quiz-attempts/{attempt}/review', [MahasiswaQuizController::class, 'review'])->name('quizzes.review');
        Route::get('/quiz-attempts/{attempt}/completed', [MahasiswaQuizController::class, 'completed'])->name('quiz_attempts.completed');

        // RECOMMENDATION
        Route::get('/recommendations', [RecommendationController::class, 'myRecommendations'])->name('recommendations.me');
        Route::post('/recommendations/{recommendation}/complete', [RecommendationController::class, 'markCompleted'])->name('recommendations.complete');

    });

    // LEADERBOARD (mahasiswa + dosen)
    Route::middleware('role:mahasiswa')->prefix('leaderboard')->name('leaderboard.')->group(function () {
        Route::get('/practice', [LeaderboardController::class, 'practice'])->name('practice');
        Route::get('/quiz', [LeaderboardController::class, 'quiz'])->name('quiz');
        Route::get('/index', [LeaderboardController::class, 'combined'])->name('combined');
    });

    /*
    |--------------------------------------------------------------------------
    | DOSEN
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:dosen')->group(function () {

        // ===== NILAI MAHASISWA (dosen) =====
        Route::get('/dosen/nilai-mahasiswa', [ProgressController::class, 'dosenClassScoresPage'])
            ->name('dosen.grades.index');
        Route::get('/dosen/nilai-mahasiswa/{student}', [ProgressController::class, 'dosenStudentDetailPage'])
            ->name('dosen.grades.show');

        // ===== PRACTICE (dosen) =====
        Route::get('/dosen/latihan-soal', [DosenPracticeController::class, 'index'])
            ->name('dosen.practices.index');
        Route::get('/dosen/latihan-soal/{practice}/show', [DosenPracticeController::class, 'show'])
            ->name('dosen.practices.show');
        Route::get('/dosen/latihan-soal/{practice}/create', [DosenPracticeController::class, 'create'])
            ->name('dosen.practices.create');
        Route::get('/dosen/latihan-soal/{practice}', [DosenPracticeController::class, 'edit'])
            ->name('dosen.practices.edit');
        Route::post('/dosen/latihan-soal/{practice}/questions', [DosenPracticeController::class, 'saveQuestions'])
            ->name('dosen.practices.questions.save');

        // ===== QUIZZES (dosen) =====
        Route::get('/dosen/kuis', [DosenQuizController::class, 'dosenIndexPage'])
            ->name('dosen.quizzes.index');
        Route::get('/dosen/kuis/create', [DosenQuizController::class, 'dosenCreatePage'])
            ->name('dosen.quizzes.create');
        Route::get('/dosen/kuis/{quiz}/show', [DosenQuizController::class, 'dosenShowPage'])
            ->name('dosen.quizzes.show');
        Route::get('/dosen/kuis/{quiz}/edit', [DosenQuizController::class, 'dosenEditPage'])
            ->name('dosen.quizzes.edit');
        Route::post('/dosen/kuis/{quiz}/questions', [DosenQuizController::class, 'saveQuestions'])
            ->name('dosen.quizzes.questions.save');
        Route::post('/dosen/kuis/{quiz}/duplicate', [DosenQuizController::class, 'duplicateToClasses'])
            ->name('dosen.quizzes.duplicate');

        // ===== MATERI (dosen) =====
        Route::prefix('dosen/materi')->name('dosen.materials.')->group(function () {
            Route::get('/', [DosenMaterialController::class, 'index'])->name('index');
            Route::put('/reorder', [DosenMaterialController::class, 'reorderMaterials'])->name('reorder');
            Route::get('/create', [DosenMaterialController::class, 'create'])->name('create');
            Route::get('/{material}/show', [DosenMaterialController::class, 'show'])->name('show');
            Route::get('/{material}/edit', [DosenMaterialController::class, 'edit'])->name('edit');
            Route::post('/', [DosenMaterialController::class, 'store'])->name('store');
            Route::put('/{material}', [DosenMaterialController::class, 'update'])->name('update');
        });

        // ===== KELAS (halaman ManageClasses untuk dosen) =====
        Route::get('/dosen/kelas', [ClassController::class, 'manageIndex'])->name('dosen.classes.index');

        // ===== PRACTICE =====
        Route::post('/practices', [DosenPracticeController::class, 'store'])->name('dosen.practices.store');
        Route::delete('/practices/{practice}', [DosenPracticeController::class, 'destroy'])->name('dosen.practices.destroy');

        // ===== QUIZ =====
        Route::post('/quizzes', [DosenQuizController::class, 'store'])->name('quizzes.store');
        Route::put('/quizzes/{quiz}', [DosenQuizController::class, 'update'])->name('quizzes.update');
        Route::delete('/quizzes/{quiz}', [DosenQuizController::class, 'destroy'])->name('quizzes.destroy');

        // bank soal quiz
        Route::post('/quiz-questions', [DosenQuizController::class, 'questionStore'])->name('quiz_questions.store');
        Route::put('/quiz-questions/{question}', [DosenQuizController::class, 'questionUpdate'])->name('quiz_questions.update');
        Route::delete('/quiz-questions/{question}', [DosenQuizController::class, 'questionDestroy'])->name('quiz_questions.destroy');

        Route::post('/quiz-questions/{question}/image', [DosenQuizController::class, 'uploadQuestionImage'])->name('quiz_questions.image.upload');
        Route::delete('/quiz-questions/{question}/image', [DosenQuizController::class, 'deleteQuestionImage'])->name('quiz_questions.image.delete');

        // quiz map + points
        Route::post('/quizzes/{quiz}/map', [DosenQuizController::class, 'mapAttach'])->name('quizzes.map.attach');
        Route::put('/quizzes/{quiz}/map/{question}', [DosenQuizController::class, 'mapUpdate'])->name('quizzes.map.update');
        Route::delete('/quizzes/{quiz}/map/{question}', [DosenQuizController::class, 'mapDetach'])->name('quizzes.map.detach');

    });

    // API kelas (dipakai di halaman ManageClasses) untuk dosen & superadmin
    Route::middleware('role:dosen,superadmin')->group(function () {
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
    Route::middleware('role:superadmin')->group(function () {


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
            Route::get('/', [DosenMaterialController::class, 'index'])->name('index');
            Route::put('/reorder', [DosenMaterialController::class, 'reorderMaterials'])->name('reorder');
            Route::get('/create', [DosenMaterialController::class, 'create'])->name('create');
            Route::get('/{material}/show', [DosenMaterialController::class, 'show'])->name('show');
            Route::get('/{material}/edit', [DosenMaterialController::class, 'edit'])->name('edit');
            Route::post('/', [DosenMaterialController::class, 'store'])->name('store');
            Route::put('/{material}', [DosenMaterialController::class, 'update'])->name('update');
        });

        // ===== KELAS (halaman ManageClasses untuk superadmin) =====
        Route::get('/superadmin/kelas', [ClassController::class, 'manageIndex'])->name('superadmin.classes.index');

        // Kelola Latihan Soal (superadmin) -> gunakan halaman ManagePractices (method sama dg dosen)
        Route::get('/superadmin/latihan-soal', [DosenPracticeController::class, 'index'])
            ->name('superadmin.practices.index');

        Route::get('/superadmin/latihan-soal/{practice}/show', [DosenPracticeController::class, 'show'])
            ->name('superadmin.practices.show');
        Route::get('/superadmin/latihan-soal/{practice}/create', [DosenPracticeController::class, 'create'])
            ->name('superadmin.practices.create');
        Route::get('/superadmin/latihan-soal/{practice}', [DosenPracticeController::class, 'edit'])
            ->name('superadmin.practices.edit');

        // Simpan soal latihan (superadmin) menggunakan method yang sama dengan dosen
        Route::post('/superadmin/latihan-soal/{practice}/questions', [DosenPracticeController::class, 'saveQuestions'])
            ->name('superadmin.practices.questions.save');

        // Kelola Kuis (superadmin) -> gunakan halaman ManageQuizzes
        Route::prefix('superadmin/kuis')->name('superadmin.quizzes.')->group(function () {
            Route::get('/', [DosenQuizController::class, 'dosenIndexPage'])->name('index');
            Route::get('/create', [DosenQuizController::class, 'dosenCreatePage'])->name('create');
            Route::get('/{quiz}/show', [DosenQuizController::class, 'dosenShowPage'])->name('show');
            Route::get('/{quiz}/edit', [DosenQuizController::class, 'dosenEditPage'])->name('edit');
            Route::post('/', [DosenQuizController::class, 'store'])->name('store');
            Route::post('/{quiz}/questions', [DosenQuizController::class, 'saveQuestions'])->name('questions.save');
            Route::post('/{quiz}/duplicate', [DosenQuizController::class, 'duplicateToClasses'])->name('duplicate');
            Route::delete('/{quiz}', [DosenQuizController::class, 'destroy'])->name('destroy');
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