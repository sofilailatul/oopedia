<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\UserProgressModel;
use Illuminate\Http\Request;

class ProgressController extends Controller
{
    public function myProgress(Request $request)
    {
        $user = $request->user();

        $progress = UserProgressModel::with(['material', 'class'])
            ->where('user_id', $user->id)
            ->orderBy('id')
            ->get();

        return response()->json($progress);
    }
}
