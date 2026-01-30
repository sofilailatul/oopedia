<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\PracticeAttemptModel;
use App\Models\QuizAttemptModel;
use App\Models\UserModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LeaderboardController extends Controller
{
    // total final_score practice per user
    public function practice(Request $request)
    {
        $limit = (int) ($request->query('limit', 20));

        $rows = PracticeAttemptModel::select('user_id', DB::raw('SUM(final_score) as total_practice_score'))
            ->whereNotNull('user_id')
            ->groupBy('user_id')
            ->orderByDesc('total_practice_score')
            ->limit($limit)
            ->get();

        $users = UserModel::whereIn('id', $rows->pluck('user_id'))->get()->keyBy('id');

        return response()->json($rows->map(fn ($r) => [
            'user_id' => $r->user_id,
            'nama' => $users[$r->user_id]->nama ?? null,
            'score' => (int) $r->total_practice_score,
        ]));
    }

    // total quiz score per user
    public function quiz(Request $request)
    {
        $limit = (int) ($request->query('limit', 20));

        $rows = QuizAttemptModel::select('user_id', DB::raw('SUM(total_score) as total_quiz_score'))
            ->whereNotNull('user_id')
            ->groupBy('user_id')
            ->orderByDesc('total_quiz_score')
            ->limit($limit)
            ->get();

        $users = UserModel::whereIn('id', $rows->pluck('user_id'))->get()->keyBy('id');

        return response()->json($rows->map(fn ($r) => [
            'user_id' => $r->user_id,
            'nama' => $users[$r->user_id]->nama ?? null,
            'score' => (int) $r->total_quiz_score,
        ]));
    }

    // combined practice + quiz
    public function combined(Request $request)
    {
        $limit = (int) ($request->query('limit', 20));

        $practice = PracticeAttemptModel::select('user_id', DB::raw('SUM(final_score) as p'))
            ->whereNotNull('user_id')
            ->groupBy('user_id');

        $quiz = QuizAttemptModel::select('user_id', DB::raw('SUM(total_score) as q'))
            ->whereNotNull('user_id')
            ->groupBy('user_id');

        $rows = DB::query()
            ->fromSub($practice, 'p')
            ->leftJoinSub($quiz, 'q', 'p.user_id', '=', 'q.user_id')
            ->select('p.user_id', DB::raw('(p.p + COALESCE(q.q,0)) as total'))
            ->orderByDesc('total')
            ->limit($limit)
            ->get();

        $users = UserModel::whereIn('id', $rows->pluck('user_id'))->get()->keyBy('id');

        return response()->json($rows->map(fn ($r) => [
            'user_id' => $r->user_id,
            'nama' => $users[$r->user_id]->nama ?? null,
            'score' => (int) $r->total,
        ]));
    }
}
