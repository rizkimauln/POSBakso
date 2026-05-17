<?php

namespace App\Services;

use App\Models\Menu;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;

class MenuService
{
    public function paginate(array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        return Menu::query()
            ->with('category')
            ->when($filters['search'] ?? null, function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($filters['category_id'] ?? null, function ($query, int|string $categoryId): void {
                $query->where('category_id', $categoryId);
            })
            ->when(array_key_exists('is_active', $filters) && $filters['is_active'] !== null, function ($query) use ($filters): void {
                $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
            })
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }

    public function create(array $data, ?UploadedFile $image = null): Menu
    {
        $payload = Arr::except($data, ['image']);

        if ($image) {
            $payload['image_path'] = $image->store('menus', 'public');
        }

        return Menu::query()->create($payload)->load('category');
    }

    public function update(Menu $menu, array $data, ?UploadedFile $image = null): Menu
    {
        $payload = Arr::except($data, ['image']);

        if ($image) {
            $this->deleteImage($menu);
            $payload['image_path'] = $image->store('menus', 'public');
        }

        $menu->update($payload);

        return $menu->refresh()->load('category');
    }

    public function toggleActive(Menu $menu): Menu
    {
        $menu->update([
            'is_active' => ! $menu->is_active,
        ]);

        return $menu->refresh()->load('category');
    }

    public function delete(Menu $menu): void
    {
        $this->deleteImage($menu);
        $menu->delete();
    }

    private function deleteImage(Menu $menu): void
    {
        if ($menu->image_path) {
            Storage::disk('public')->delete($menu->image_path);
        }
    }
}
