<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Menus\StoreMenuRequest;
use App\Http\Requests\Menus\UpdateMenuRequest;
use App\Http\Resources\MenuResource;
use App\Models\Menu;
use App\Services\MenuService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    public function __construct(private readonly MenuService $menuService)
    {
    }

    public function index(Request $request)
    {
        $perPage = min((int) $request->integer('per_page', 10), 100);

        $menus = $this->menuService->paginate(
            $request->only(['search', 'category_id', 'is_active']),
            $perPage
        );

        return MenuResource::collection($menus)
            ->additional([
                'status' => 'success',
                'message' => 'Data menu berhasil diambil',
            ]);
    }

    public function publicIndex(Request $request)
    {
        $perPage = min((int) $request->integer('per_page', 100), 100);

        $menus = $this->menuService->paginate(
            array_merge($request->only(['search', 'category_id']), ['is_active' => true]),
            $perPage
        );

        return MenuResource::collection($menus)
            ->additional([
                'status' => 'success',
                'message' => 'Data menu aktif berhasil diambil',
            ]);
    }

    public function store(StoreMenuRequest $request)
    {
        $menu = $this->menuService->create(
            $request->validated(),
            $request->file('image')
        );

        return ApiResponse::success(
            'Menu berhasil dibuat',
            new MenuResource($menu),
            201
        );
    }

    public function show(Menu $menu)
    {
        return ApiResponse::success(
            'Detail menu berhasil diambil',
            new MenuResource($menu->load('category'))
        );
    }

    public function update(UpdateMenuRequest $request, Menu $menu)
    {
        $menu = $this->menuService->update(
            $menu,
            $request->validated(),
            $request->file('image')
        );

        return ApiResponse::success(
            'Menu berhasil diperbarui',
            new MenuResource($menu)
        );
    }

    public function destroy(Menu $menu)
    {
        $this->menuService->delete($menu);

        return ApiResponse::success('Menu berhasil dihapus');
    }

    public function toggleActive(Menu $menu)
    {
        $menu = $this->menuService->toggleActive($menu);

        return ApiResponse::success(
            'Status menu berhasil diperbarui',
            new MenuResource($menu)
        );
    }
}
