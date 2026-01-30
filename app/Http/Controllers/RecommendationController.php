<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\MaterialRecommendationModel;
use Illuminate\Http\Request;

class RecommendationController extends Controller
{
    public function myRecommendations(Request $request)
    {
        $user = $request->user();

        $recs = MaterialRecommendationModel::with(['material', 'quiz'])
            ->where('user_id', $user->id)
            ->orderByDesc('id')
            ->get();

        return response()->json($recs);
    }

    public function markCompleted(Request $request, $recommendation)
    {
        $rec = MaterialRecommendationModel::findOrFail($recommendation);

        if ($rec->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $rec->update(['is_completed' => true]);

        return response()->json($rec);
    }
}
