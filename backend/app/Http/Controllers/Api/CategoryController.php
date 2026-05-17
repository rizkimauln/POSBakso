<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Categories\StoreCategoryRequest;
use App\Http\Requests\Categories\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Services\CategoryService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function __construct(private readonly CategoryService $categoryService)
    {
    }

    public function index(Request $request)
    {
        $perPage = min((int) $request->integer('per_page', 10), 100);

        $categories = $this->categoryService->paginate(
            $request->only('search'),
            $perPage
        );

        return CategoryResource::collection($categories)
            ->additional([
                'status' => 'success',
                'message' => 'Data kategori berhasil diambil',
            ]);
    }

    public function store(StoreCategoryRequest $request)
    {
        $category = $this->categoryService->create($request->validated());

        return ApiResponse::success(
            'Kategori berhasil dibuat',
            new CategoryResource($category),
            201
        );
    }

    public function show(Category $category)
    {
        return ApiResponse::success(
            'Detail kategori berhasil diambil',
            new CategoryResource($category->loadCount('menus'))
        );
    }

    public function update(UpdateCategoryRequest $request, Category $category)
    {
        $category = $this->categoryService->update($category, $request->validated());

        return ApiResponse::success(
            'Kategori berhasil diperbarui',
            new CategoryResource($category->loadCount('menus'))
        );
    }

    public function destroy(Category $category)
    {
        if ($category->menus()->exists()) {
            return ApiResponse::error('Kategori masih memiliki menu dan tidak bisa dihapus.', 422);
        }

        $this->categoryService->delete($category);

        return ApiResponse::success('Kategori berhasil dihapus');
    }
}
