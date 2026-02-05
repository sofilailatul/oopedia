<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        // Pastikan user sudah login
        if (!$request->user()) {
            return redirect()->route('login');
        }

        $userRole = strtolower($request->user()->role ?? '');

        // Normalize roles yang diizinkan
        $allowedRoles = array_map('strtolower', $roles);

        // Cek apakah role user ada dalam daftar yang diizinkan
        if (!in_array($userRole, $allowedRoles)) {
            // Redirect berdasarkan role
            return match ($userRole) {
                'superadmin', 'admin' => redirect()->route('admin.users.index'),
                'dosen' => redirect()->route('classes.index'),
                'mahasiswa' => redirect()->route('dashboard'),
                'tamu' => redirect()->route('dashboard'),
                default => redirect()->route('dashboard'),
            };
        }

        return $next($request);
    }
}