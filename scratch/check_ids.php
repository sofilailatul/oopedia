<?php
// Scratch script to check DB consistency for practice questions, items, and options
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\PracticeQuestionModel;
use App\Models\PracticeItemModel;
use App\Models\PracticeOptionModel;

$questions = PracticeQuestionModel::latest()->limit(3)->get();
echo "Latest 3 Questions:\n";
foreach ($questions as $q) {
    echo "ID: {$q->id} | Type: {$q->type} | Text: " . substr($q->question_text, 0, 30) . "...\n";
    
    $items = PracticeItemModel::where('practice_questions_id', $q->id)->get();
    echo "  [Items] Count: " . $items->count() . "\n";
    foreach ($items as $item) {
        echo "    Item PK: {$item->id} | FK: {$item->practice_questions_id}\n";
    }

    $options = PracticeOptionModel::where('practice_questions_id', $q->id)->get();
    echo "  [Options] Count: " . $options->count() . "\n";
    foreach ($options as $opt) {
        echo "    Option PK: {$opt->id} | FK: {$opt->practice_questions_id}\n";
    }
    echo str_repeat('-', 40) . "\n";
}
