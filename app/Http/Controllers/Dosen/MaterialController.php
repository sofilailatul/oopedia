<?php

namespace App\Http\Controllers\Dosen;

use App\Http\Controllers\Controller;
use App\Models\MaterialContentModel;
use App\Models\MaterialModel;
use App\Models\SubTopicModel;
use App\Models\UserModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MaterialController extends Controller
{
	public function create(Request $request)
	{
		$user = $request->user();

		$lecturers = [];
		if (strtolower($user->role) === 'superadmin') {
			$lecturers = UserModel::where('role', 'dosen')
				->orderBy('nama')
				->get(['id', 'nama', 'email']);
		}

		$material = null;
		$subTopics = [];
		$materialId = $request->integer('material');
		if ($materialId) {
			$materialModel = MaterialModel::with(['subTopics', 'contents.subTopic', 'creator'])
				->find($materialId);

			if ($materialModel) {
				$material = [
					'id' => $materialModel->id,
					'material_name' => $materialModel->material_name,
					'description' => $materialModel->description,
					'order_number' => $materialModel->order_number,
					'contents' => $materialModel->contents->map(function ($content) {
						return [
							'id' => $content->id,
							'title' => $content->title,
							'content_text' => $content->content_text,
							'subtopic_id' => $content->subtopic_id,
							'image_path' => $content->image_path,
							'image_url' => $content->image_url,
						];
					}),
				];

				$subTopics = $materialModel->subTopics->map(function ($subTopic) {
					return [
						'id' => $subTopic->id,
						'name' => $subTopic->name,
					];
				});
			}
		}

		return Inertia::render('ManageMaterial/Create', [
			'authUser' => $user,
			'lecturers' => $lecturers,
			'material' => $material,
			'subTopics' => $subTopics,
		]);
	}

	public function index(Request $request)
	{
		$user = $request->user();
		$role = strtolower($user->role ?? '');

		$query = MaterialModel::query()
			->withExists('progress as is_locked')
			->with(['creator:id,nama,email'])
			->select('id', 'material_name', 'order_number', 'created_by')
			->orderBy('order_number');

		if ($role !== 'superadmin') {
			$query->where('created_by', $user->id);
		}

		$materials = $query->get()->map(function ($m) {
			return [
				'id' => $m->id,
				'material_name' => $m->material_name,
				'order_number' => $m->order_number,
				'is_locked' => (bool) $m->is_locked,
				'lecturer_name' => $m->creator?->name
					?? $m->creator?->nama
					?? '—',
			];
		});

		return Inertia::render('ManageMaterial/Index', [
			'materials' => $materials,
			'authUser' => $user,
		]);
	}

	public function show(Request $request, MaterialModel $material)
	{
		$material->load(['creator', 'contents' => function ($q) {
			$q->orderBy('sort_order');
		}, 'contents.subTopic']);

		$author = $material->creator?->name
			?? $material->creator?->nama
			?? '—';

		return Inertia::render('ManageMaterial/Show', [
			'authUser' => $request->user(),
			'material' => [
				'id' => $material->id,
				'material_name' => $material->material_name,
				'description' => $material->description,
				'order_number' => $material->order_number,
				'created_at' => $material->created_at,
				'author' => $author,
				'contents' => $material->contents->map(function ($c) {
					return [
						'id' => $c->id,
						'title' => $c->title,
						'content_text' => $c->content_text,
						'sub_topic' => $c->subTopic?->name,
						'image_path' => $c->image_path,
						'image_url' => $c->image_url,
					];
				}),
			],
		]);
	}

	public function edit(Request $request, MaterialModel $material)
	{
		$user = $request->user();
		if (strtolower($user->role) !== 'superadmin' && $material->created_by !== $user->id) {
			abort(403, 'Akses ditolak. Anda tidak berhak mengedit materi ini.');
		}

		$material->load(['creator', 'contents' => function ($q) {
			$q->orderBy('sort_order');
		}, 'contents.subTopic']);

		$author = $material->creator?->name
			?? $material->creator?->nama
			?? '—';

		return Inertia::render('ManageMaterial/Edit', [
			'authUser' => $request->user(),
			'material' => [
				'id' => $material->id,
				'material_name' => $material->material_name,
				'description' => $material->description,
				'order_number' => $material->order_number,
				'author' => $author,
				'contents' => $material->contents->map(function ($c) {
					return [
						'id' => $c->id,
						'title' => $c->title,
						'content_text' => $c->content_text,
						'sub_topic' => $c->subTopic?->name,
						'image_path' => $c->image_path,
						'image_url' => $c->image_url,
					];
				}),
			],
		]);
	}

	public function store(Request $request)
	{
		$baseRules = [
			'material_name' => ['required', 'string', 'max:255'],
			'description' => ['nullable', 'string'],
			'order_number' => ['nullable', 'integer', 'min:1'],
			'create_mode' => ['nullable', 'boolean'],
			'sub_topic' => ['nullable', 'string', 'max:255'],
			'sub_topics' => ['nullable', 'array'],
			'sub_topics.*' => ['nullable', 'string', 'max:255'],
			'sections' => ['nullable', 'array'],
			'sections.*.title' => ['nullable', 'string', 'max:255'],
			'sections.*.content_text' => ['nullable', 'string'],
			'sections.*.subtopic_id' => ['nullable', 'integer'],
			'sections.*.sub_topic' => ['nullable', 'string', 'max:255'],
			'sections.*.image' => ['nullable', 'image', 'mimes:png,jpg,jpeg,webp', 'max:2048'],
		];

		if (strtolower($request->user()->role) === 'superadmin') {
			$baseRules['lecturer_id'] = ['required', 'integer', 'exists:users,id'];
		}

		$data = $request->validate($baseRules);

		$nextOrder = $data['order_number']
			?? ((MaterialModel::max('order_number') ?? 0) + 1);

		$creatorId = $request->user()->id;
		if (strtolower($request->user()->role) === 'superadmin') {
			$lecturer = UserModel::where('id', $data['lecturer_id'] ?? null)
				->where('role', 'dosen')
				->firstOrFail();
			$creatorId = $lecturer->id;
		}

		$material = MaterialModel::create([
			'material_name' => $data['material_name'],
			'description' => $data['description'] ?? null,
			'content' => null,
			'order_number' => $nextOrder,
			'created_by' => $creatorId,
		]);

		$isCreateMode = (bool) ($data['create_mode'] ?? false);
		if ($isCreateMode) {
			$initialSubTopics = $data['sub_topics'] ?? [];
			if (empty($initialSubTopics) && !empty($data['sub_topic'])) {
				$initialSubTopics = [$data['sub_topic']];
			}

			foreach ($initialSubTopics as $subTopicName) {
				$subTopicName = trim((string) $subTopicName);
				if ($subTopicName === '') {
					continue;
				}

				SubTopicModel::firstOrCreate([
					'material_id' => $material->id,
					'name' => $subTopicName,
				]);
			}

			$routeName = strtolower($request->user()->role ?? '') === 'superadmin'
				? 'superadmin.materials.create'
				: 'dosen.materials.create';

			return redirect()->route($routeName, ['material' => $material->id]);
		}

		$sections = $data['sections'] ?? [];
		$sort = 1;

		foreach ($sections as $index => $sectionData) {
			$text = $sectionData['content_text'] ?? null;
			$title = $sectionData['title'] ?? null;
			$subTopicId = $sectionData['subtopic_id'] ?? null;
			$subTopicName = $sectionData['sub_topic'] ?? null;
			$imageFile = $request->file("sections.$index.image");

			if (!$title && !$text && !$imageFile) {
				continue;
			}

			$imagePath = null;
			if ($imageFile) {
				$imagePath = $imageFile->store("materials/{$material->id}/sections", 'public');
			}

			$section = MaterialContentModel::create([
				'material_id' => $material->id,
				'title' => $title,
				'content_text' => $text ?? '',
				'image_path' => $imagePath,
				'sort_order' => $sort++,
			]);

			$this->syncMaterialSectionSubTopic($material, $section, $subTopicName, $subTopicId);
		}

		$role = strtolower($request->user()->role ?? '');
		if ($role === 'superadmin') {
			return redirect()->route('superadmin.materials.index');
		}

		return redirect()->route('dosen.materials.index');
	}

	public function update(Request $request, MaterialModel $material)
	{
		$user = $request->user();
		if (strtolower($user->role ?? '') !== 'superadmin' && $material->created_by !== $user->id) {
			abort(403, 'Akses ditolak.');
		}

		$data = $request->validate([
			'material_name' => ['required', 'string', 'max:255'],
			'description' => ['nullable', 'string'],
			'order_number' => ['required', 'integer', 'min:1'],
			'sections' => ['nullable', 'array'],
			'sections.*.id' => ['nullable', 'integer'],
			'sections.*.title' => ['nullable', 'string', 'max:255'],
			'sections.*.content_text' => ['nullable', 'string'],
			'sections.*.subtopic_id' => ['nullable', 'integer'],
			'sections.*.sub_topic' => ['nullable', 'string', 'max:255'],
			'sections.*.image' => ['nullable', 'image', 'mimes:png,jpg,jpeg,webp', 'max:2048'],
		]);

		$material->update([
			'material_name' => $data['material_name'],
			'description' => $data['description'] ?? null,
			'order_number' => $data['order_number'],
		]);

		$existingSections = MaterialContentModel::where('material_id', $material->id)
			->orderBy('sort_order')
			->get()
			->keyBy('id');

		$keepIds = [];
		$sort = 1;

		foreach (($data['sections'] ?? []) as $index => $sectionData) {
			$text = $sectionData['content_text'] ?? null;
			$title = $sectionData['title'] ?? null;
			$subTopicId = $sectionData['subtopic_id'] ?? null;
			$subTopicName = $sectionData['sub_topic'] ?? null;
			$imageFile = $request->file("sections.$index.image");
			$sectionId = $sectionData['id'] ?? null;

			if (!$title && !$text && !$imageFile) {
				continue;
			}

			if ($sectionId && $existingSections->has($sectionId)) {
				$section = $existingSections[$sectionId];
				$section->title = $title;
				$section->content_text = $text ?? '';

				if ($imageFile) {
					$imagePath = $imageFile->store("materials/{$material->id}/sections", 'public');
					$section->image_path = $imagePath;
				}

				$section->sort_order = $sort++;
				$section->save();

				$this->syncMaterialSectionSubTopic($material, $section, $subTopicName, $subTopicId);
				$keepIds[] = $section->id;
			} else {
				$imagePath = null;
				if ($imageFile) {
					$imagePath = $imageFile->store("materials/{$material->id}/sections", 'public');
				}

				$section = MaterialContentModel::create([
					'material_id' => $material->id,
					'title' => $title,
					'content_text' => $text ?? '',
					'image_path' => $imagePath,
					'sort_order' => $sort++,
				]);

				$this->syncMaterialSectionSubTopic($material, $section, $subTopicName, $subTopicId);
				$keepIds[] = $section->id;
			}
		}

		if (count($keepIds) > 0) {
			MaterialContentModel::where('material_id', $material->id)
				->whereNotIn('id', $keepIds)
				->delete();
		} else {
			MaterialContentModel::where('material_id', $material->id)->delete();
		}

		$role = strtolower($user->role ?? '');
		if ($role === 'superadmin') {
			return redirect()->route('superadmin.materials.show', $material->id);
		}

		return redirect()->route('dosen.materials.show', $material->id);
	}

	public function reorderMaterials(Request $request)
	{
		$data = $request->validate([
			'material_ids' => ['required', 'array', 'min:1'],
			'material_ids.*' => ['integer'],
		]);

		$lockedMaterials = MaterialModel::whereIn('id', $data['material_ids'])
			->has('progress')
			->get(['id', 'order_number'])
			->keyBy('id');

		foreach ($data['material_ids'] as $i => $id) {
			$newOrder = $i + 1;
			if ($lockedMaterials->has($id)) {
				$oldOrder = $lockedMaterials->get($id)->order_number;
				if ($oldOrder !== $newOrder) {
					return response()->json([
						'message' => 'Urutan materi tidak dapat diubah karena sudah digunakan oleh mahasiswa.',
						'locked' => true,
					], 403);
				}
			}
		}

		DB::transaction(function () use ($data) {
			foreach ($data['material_ids'] as $i => $id) {
				MaterialModel::where('id', $id)->update(['order_number' => $i + 1]);
			}
		});

		return response()->json(['message' => 'materials reordered successfully']);
	}

	public function apiStore(Request $request)
	{
		$data = $request->validate([
			'material_name' => ['required', 'string', 'max:255'],
			'order_number' => ['required', 'integer', 'min:1'],
			'description' => ['nullable', 'string'],
			'content' => ['nullable', 'string'],
		]);

		$material = MaterialModel::create([
			...$data,
			'created_by' => $request->user()->id,
		]);

		return response()->json($material, 201);
	}

	public function apiUpdate(Request $request, $material)
	{
		$material = MaterialModel::findOrFail($material);

		$data = $request->validate([
			'material_name' => ['sometimes', 'required', 'string', 'max:255'],
			'order_number' => ['sometimes', 'required', 'integer', 'min:1'],
			'description' => ['sometimes', 'nullable', 'string'],
			'content' => ['sometimes', 'nullable', 'string'],
		]);

		$material->update($data);

		return response()->json($material);
	}

	public function apiDestroy($material)
	{
		$material = MaterialModel::findOrFail($material);
		$material->delete();

		return response()->json(['message' => 'deleted']);
	}

	public function storeSection(Request $request, $material)
	{
		$material = MaterialModel::findOrFail($material);
		if ($material->created_by !== $request->user()->id) {
			abort(403, 'Akses ditolak.');
		}

		$data = $request->validate([
			'title' => ['nullable', 'string', 'max:255'],
			'content_text' => ['required', 'string'],
			'subtopic_id' => ['nullable', 'integer'],
			'sub_topic' => ['nullable', 'string', 'max:255'],
			'image' => ['nullable', 'image', 'mimes:png,jpg,jpeg,webp', 'max:2048'],
		]);

		$imagePath = null;
		if ($request->hasFile('image')) {
			$imagePath = $request->file('image')
				->store("materials/{$material->id}/sections", 'public');
		}

		$maxSort = MaterialContentModel::where('material_id', $material->id)->max('sort_order') ?? 0;

		$section = MaterialContentModel::create([
			'material_id' => $material->id,
			'title' => $data['title'] ?? null,
			'content_text' => $data['content_text'],
			'image_path' => $imagePath,
			'sort_order' => $maxSort + 1,
		]);

		$this->syncMaterialSectionSubTopic($material, $section, $data['sub_topic'] ?? null, $data['subtopic_id'] ?? null);

		return response()->json($section, 201);
	}

	public function updateSection(Request $request, $material, $section)
	{
		$material = MaterialModel::findOrFail($material);
		if ($material->created_by !== $request->user()->id) {
			abort(403, 'Akses ditolak.');
		}

		$section = MaterialContentModel::where('material_id', $material->id)
			->findOrFail($section);

		$data = $request->validate([
			'title' => ['sometimes', 'nullable', 'string', 'max:255'],
			'content_text' => ['sometimes', 'required', 'string'],
			'subtopic_id' => ['sometimes', 'nullable', 'integer'],
			'sub_topic' => ['sometimes', 'nullable', 'string', 'max:255'],
			'image' => ['sometimes', 'nullable', 'image', 'mimes:png,jpg,jpeg,webp', 'max:2048'],
		]);

		if ($request->hasFile('image')) {
			$imagePath = $request->file('image')
				->store("materials/{$material->id}/sections", 'public');

			$section->image_path = $imagePath;
		}

		if (array_key_exists('title', $data)) {
			$section->title = $data['title'];
		}
		if (array_key_exists('content_text', $data)) {
			$section->content_text = $data['content_text'];
		}
		if (array_key_exists('subtopic_id', $data) || array_key_exists('sub_topic', $data)) {
			$this->syncMaterialSectionSubTopic(
				$material,
				$section,
				$data['sub_topic'] ?? null,
				$data['subtopic_id'] ?? null
			);
		}

		$section->save();

		return response()->json($section);
	}

	public function deleteSection(Request $request, $material, $section)
	{
		$material = MaterialModel::findOrFail($material);
		if ($material->created_by !== $request->user()->id) {
			abort(403, 'Akses ditolak.');
		}

		$section = MaterialContentModel::where('material_id', $material->id)
			->findOrFail($section);

		$section->delete();

		return response()->json(['message' => 'deleted']);
	}

	public function reorderSections(Request $request, $material)
	{
		$material = MaterialModel::findOrFail($material);
		if ($material->created_by !== $request->user()->id) {
			abort(403, 'Akses ditolak.');
		}

		$data = $request->validate([
			'section_ids' => ['required', 'array', 'min:1'],
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

	private function syncMaterialSectionSubTopic(MaterialModel $material, MaterialContentModel $section, ?string $subTopicName, ?int $subTopicId = null): void
	{
		if ($subTopicId) {
			$subTopic = SubTopicModel::query()
				->where('id', $subTopicId)
				->where('material_id', $material->id)
				->first();

			if (!$subTopic) {
				return;
			}

			$section->subtopic_id = $subTopicId;
			$section->save();
			return;
		}

		$subTopicName = trim((string) $subTopicName);

		if ($subTopicName === '') {
			if ($section->subtopic_id) {
				$section->subtopic_id = null;
				$section->save();
			}

			return;
		}

		$subTopic = SubTopicModel::query()->firstOrCreate([
			'material_id' => $material->id,
			'name' => $subTopicName,
		]);

		if ((int) $section->subtopic_id !== (int) $subTopic->id) {
			$section->subtopic_id = $subTopic->id;
			$section->save();
		}
	}
}
