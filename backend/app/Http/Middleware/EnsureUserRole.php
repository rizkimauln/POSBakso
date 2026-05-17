<?php

namespace App\Http\Middleware;

use App\Support\ApiResponse;
use BackedEnum;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return ApiResponse::error('Unauthenticated.', 401);
        }

        $role = $user->role;
        $role = $role instanceof BackedEnum ? $role->value : $role;

        if (! in_array($role, $roles, true)) {
            return ApiResponse::error('Anda tidak memiliki akses ke fitur ini.', 403);
        }

        return $next($request);
    }
}
