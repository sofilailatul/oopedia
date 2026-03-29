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
    Route::get('/materi', [MaterialController::class, 'index'])->name('materials.index');
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
    Route::middleware('auth', 'role:mahasiswa,dosen')->prefix('leaderboard')->name('leaderboard.')->group(function () {
        Route::get('/practice', [LeaderboardController::class, 'practice'])->name('practice');
        Route::get('/quiz', [LeaderboardController::class, 'quiz'])->name('quiz');
        Route::get('/combined', [LeaderboardController::class, 'combined'])->name('combined');
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

        // ===== KELOLA MATERI (dosen) =====
        Route::get('/dosen/materi', [MaterialController::class, 'dosenIndex'])->name('dosen.materials.index');
        Route::put('/dosen/materi/reorder', [MaterialController::class, 'reorderMaterials'])->name('dosen.materials.reorder');
        Route::get('/dosen/materi/create', [MaterialController::class, 'dosenCreate'])->name('dosen.materials.create');
        Route::get('/dosen/materi/{material}', [MaterialController::class, 'dosenShow'])->name('dosen.materials.show');
        Route::get('/dosen/materi/{material}/edit', [MaterialController::class, 'dosenEdit'])->name('dosen.materials.edit');
        Route::post('/dosen/materi', [MaterialController::class, 'dosenStore'])->name('dosen.materials.store');
        Route::put('/dosen/materi/{material}', [MaterialController::class, 'dosenUpdate'])->name('dosen.materials.update');

        // ===== KELAS =====
        Route::get('/dosen/kelas', [ClassController::class, 'dosenIndexPage'])->name('dosen.classes.index');
        Route::get('/classes', [ClassController::class, 'index'])->name('classes.index');
        Route::get('/classes/{class}', [ClassController::class, 'show'])->name('classes.show');
        Route::post('/classes', [ClassController::class, 'store'])->name('classes.store');
        Route::put('/classes/{class}', [ClassController::class, 'update'])->name('classes.update');
        Route::delete('/classes/{class}', [ClassController::class, 'destroy'])->name('classes.destroy');

        // ===== MATERI =====
        Route::post('/materials', [MaterialController::class, 'store'])->name('materials.store');
        Route::put('/materials/{material}', [MaterialController::class, 'update'])->name('materials.update');
        Route::delete('/materials/{material}', [MaterialController::class, 'destroy'])->name('materials.destroy');

        Route::post('/materials/{material}/sections', [MaterialController::class, 'storeSection'])->name('materials.sections.store');
        Route::put('/materials/{material}/sections/{section}', [MaterialController::class, 'updateSection'])->name('materials.sections.update');
        Route::delete('/materials/{material}/sections/{section}', [MaterialController::class, 'deleteSection'])->name('materials.sections.delete');
        Route::put('/materials/{material}/sections-reorder', [MaterialController::class, 'reorderSections'])->name('materials.sections.reorder');

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

    /*
    |--------------------------------------------------------------------------
    | SUPERADMIN
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:superadmin')->prefix('admin')->name('admin.')->group(function () {

        // manage user (controller khusus admin biar rapi)
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::get('/users/{user}', [UserController::class, 'show'])->name('users.show');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
        Route::put('/users/{user}/role', [UserController::class, 'updateRole'])->name('users.role');

        Route::prefix('leaderboard')->name('leaderboard.')->group(function () {
            Route::get('/practice', [LeaderboardController::class, 'practice'])->name('practice');
            Route::get('/quiz', [LeaderboardController::class, 'quiz'])->name('quiz');
            Route::get('/combined', [LeaderboardController::class, 'combined'])->name('combined');
        });
    });
});
