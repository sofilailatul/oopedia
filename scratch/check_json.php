<?php
// Scratch script to check JSON serialization of specific question
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\PracticeQuestionModel;

$q = PracticeQuestionModel::with(['items'])->find(92);
if ($q) {
    echo json_encode($q->toArray(), JSON_PRETTY_PRINT);
} else {
    echo "Question 92 not found.";
}
