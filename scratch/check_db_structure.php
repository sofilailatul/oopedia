<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$practice = DB::table('practices')->limit(5)->get();
echo "Practices sample:\n";
print_r($practice->toArray());

$attempts = DB::table('practice_attempts')->limit(5)->get();
echo "\nAttempts sample:\n";
print_r($attempts->toArray());
