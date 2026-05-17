<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Users\StoreUserRequest;
use App\Http\Requests\Users\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\UserService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(private readonly UserService $userService)
    {
    }

    public function index(Request $request)
    {
        $perPage = min((int) $request->integer('per_page', 10), 100);

        $users = $this->userService->paginate(
            $request->only(['search', 'role']),
            $perPage
        );

        return UserResource::collection($users)
            ->additional([
                'status' => 'success',
                'message' => 'Data user berhasil diambil',
            ]);
    }

    public function store(StoreUserRequest $request)
    {
        $user = $this->userService->create($request->validated());

        return ApiResponse::success(
            'User berhasil dibuat',
            new UserResource($user),
            201
        );
    }

    public function show(User $user)
    {
        return ApiResponse::success(
            'Detail user berhasil diambil',
            new UserResource($user)
        );
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $user = $this->userService->update($user, $request->validated());

        return ApiResponse::success(
            'User berhasil diperbarui',
            new UserResource($user)
        );
    }

    public function destroy(Request $request, User $user)
    {
        if ($request->user()?->id === $user->id) {
            return ApiResponse::error('Anda tidak bisa menghapus akun sendiri.', 422);
        }

        if ($user->orders()->exists()) {
            return ApiResponse::error('User sudah memiliki riwayat order dan tidak bisa dihapus.', 422);
        }

        $this->userService->delete($user);

        return ApiResponse::success('User berhasil dihapus');
    }
}
