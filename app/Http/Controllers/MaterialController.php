<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\MaterialModel;
use App\Models\MaterialContentModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MaterialController extends Controller
{
    public function index()
    {
        $materials = MaterialModel::withCount('contents')
            ->orderBy('order_number')
            ->get();

        return response()->json($materials);
    }

    public function show($material)
    {
        $material = MaterialModel::with('contents')->findOrFail($material);

        return response()->json([
            'id' => $material->id,
            'material_name' => $material->material_name,
            'description' => $material->description,
            'sections' => $material->contents->map(fn ($c) => [
                'id' => $c->id,
                'title' => $c->title,
                'content' => $c->content_text,
                'image' => $c->image_path,
                'order' => $c->sort_order,
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'material_name' => ['required','string','max:255'],
            'order_number' => ['required','integer','min:1'],
            'description' => ['nullable','string'],
            'content' => ['nullable','string'],
        ]);

        $material = MaterialModel::create([
            ...$data,
            'created_by' => $request->user()->id,
        ]);

        return response()->json($material, 201);
    }

    public function update(Request $request, $material)
    {
        $material = MaterialModel::findOrFail($material);

        $data = $request->validate([
            'material_name' => ['sometimes','required','string','max:255'],
            'order_number' => ['sometimes','required','integer','min:1'],
            'description' => ['sometimes','nullable','string'],
            'content' => ['sometimes','nullable','string'],
        ]);

        $material->update($data);

        return response()->json($material);
    }

    public function destroy($material)
    {
        $material = MaterialModel::findOrFail($material);
        $material->delete();

        return response()->json(['message' => 'deleted']);
    }

    // ===== SECTIONS (material_contents) =====
    public function storeSection(Request $request, $material)
    {
        $material = MaterialModel::findOrFail($material);

        $data = $request->validate([
            'title' => ['nullable','string','max:255'],
            'content_text' => ['required','string'],
            'image_path' => ['nullable','string','max:255'],
        ]);

        $maxSort = MaterialContentModel::where('material_id', $material->id)->max('sort_order') ?? 0;

        $section = MaterialContentModel::create([
            'material_id' => $material->id,
            'title' => $data['title'] ?? null,
            'content_text' => $data['content_text'],
            'image_path' => $data['image_path'] ?? null,
            'sort_order' => $maxSort + 1,
        ]);

        return response()->json($section, 201);
    }

    public function updateSection(Request $request, $material, $section)
    {
        $material = MaterialModel::findOrFail($material);

        $section = MaterialContentModel::where('material_id', $material->id)
            ->findOrFail($section);

        $data = $request->validate([
            'title' => ['sometimes','nullable','string','max:255'],
            'content_text' => ['sometimes','required','string'],
            'image_path' => ['sometimes','nullable','string','max:255'],
        ]);

        $section->update($data);

        return response()->json($section);
    }

    public function deleteSection($material, $section)
    {
        $material = MaterialModel::findOrFail($material);

        $section = MaterialContentModel::where('material_id', $material->id)
            ->findOrFail($section);

        $section->delete();

        return response()->json(['message' => 'deleted']);
    }

    public function reorderSections(Request $request, $material)
    {
        $material = MaterialModel::findOrFail($material);

        $data = $request->validate([
            'section_ids' => ['required','array','min:1'],
            'section_ids.*' => ['integer'],
        ]);

        DB::transaction(function () use ($material, $data) {
            foreach ($data['section_ids'] as $i => $id) {
                MaterialContentModel::where('material_id', $material->id)
                    ->where('id', $id)
                    ->update(['sort_order' => $i + 1]);
            }
        });

        return response()->json(['message' => 'reordered']);
    }
}
