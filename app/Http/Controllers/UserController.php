<?php

namespace App\Http\Controllers;

use App\Models\UserModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = UserModel::query()->with('classes');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('nama', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($role = $request->input('role')) {
            $query->where('role', $role);
        }

        $users = $query
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('SuperAdmin/Users/Index', [
            'filters' => [
                'search' => $search,
                'role' => $role,
            ],
            'users' => $users,
        ]);
    }

    public function create()
    {
        return Inertia::render('SuperAdmin/Users/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in(['superadmin', 'dosen', 'mahasiswa', 'tamu'])],
        ]);

        $user = UserModel::create([
            'nama' => $validated['nama'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
        ]);

        return redirect()
            ->route('superadmin.users.index')
            ->with('success', 'User berhasil dibuat.');
    }

    public function show(UserModel $user)
    {
        return Inertia::render('SuperAdmin/Users/Show', [
            'user' => $user,
        ]);
    }

    public function edit(UserModel $user)
    {
        return Inertia::render('SuperAdmin/Users/Edit', [
            'user' => $user,
        ]);
    }

    public function update(Request $request, UserModel $user)
    {
        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['required', Rule::in(['superadmin', 'dosen', 'mahasiswa', 'tamu'])],
        ]);

        $user->nama = $validated['nama'];
        $user->email = $validated['email'];
        $user->role = $validated['role'];

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return redirect()
            ->route('superadmin.users.index')
            ->with('success', 'User berhasil diperbarui.');
    }

    public function destroy(UserModel $user)
    {
        // Hindari menghapus diri sendiri
        if (Auth::id() !== null && Auth::id() === $user->getKey()) {
            return back()->with('error', 'Anda tidak dapat menghapus akun sendiri.');
        }

        $user->delete();

        return redirect()
            ->route('superadmin.users.index')
            ->with('success', 'User berhasil dihapus.');
    }

    public function updateRole(Request $request, UserModel $user)
    {
        $validated = $request->validate([
            'role' => ['required', Rule::in(['superadmin', 'dosen', 'mahasiswa', 'tamu'])],
        ]);

        $user->role = $validated['role'];
        $user->save();

        return redirect()
            ->route('superadmin.users.show', $user)
            ->with('success', 'Role user berhasil diperbarui.');
    }
}
