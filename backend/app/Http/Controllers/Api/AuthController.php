<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Support\ApiResponse;

class AuthController extends Controller
{
    /**
     * Proses Login Kasir / Admin
     */
    public function login(LoginRequest $request)
    {
        $credentials = $request->validated();
        $user = User::query()->where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            return ApiResponse::error('Kredensial tidak valid. Silakan periksa email dan password Anda.', 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return ApiResponse::success('Login berhasil', [
                'access_token' => $token,
                'token_type' => 'Bearer',
                'user' => new UserResource($user),
        ]);
    }

    public function logout(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $user->currentAccessToken()->delete();

        return ApiResponse::success('Logout berhasil');
    }

    /**
     * Ambil data user yang sedang login
     */
    public function me(Request $request)
    {
        return ApiResponse::success('Data user berhasil diambil', [
            'user' => new UserResource($request->user()),
        ]);
    }
}
