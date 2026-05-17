<?php

namespace App\Services;

use App\Enums\TableStatus;
use App\Models\Table;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class TableService
{
    public function paginate(array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        return Table::query()
            ->withCount('orders')
            ->when($filters['search'] ?? null, function ($query, string $search): void {
                $query->where('table_number', 'like', "%{$search}%");
            })
            ->when($filters['status'] ?? null, function ($query, string $status): void {
                $query->where('status', $status);
            })
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }

    public function create(array $data): Table
    {
        $payload = Arr::only($data, ['table_number', 'status']);
        $payload['status'] ??= TableStatus::Kosong->value;
        $payload['qr_token'] = $this->generateUniqueQrToken();

        return Table::query()->create($payload);
    }

    public function update(Table $table, array $data): Table
    {
        $table->update(Arr::only($data, ['table_number', 'status']));

        return $table->refresh();
    }

    public function updateStatus(Table $table, string $status): Table
    {
        $table->update([
            'status' => $status,
        ]);

        return $table->refresh();
    }

    public function regenerateQrToken(Table $table): Table
    {
        $table->update([
            'qr_token' => $this->generateUniqueQrToken(),
        ]);

        return $table->refresh();
    }

    public function delete(Table $table): void
    {
        $table->delete();
    }

    public function findByQrToken(string $qrToken): ?Table
    {
        return Table::query()->where('qr_token', $qrToken)->first();
    }

    private function generateUniqueQrToken(): string
    {
        do {
            $token = Str::random(40);
        } while (Table::query()->where('qr_token', $token)->exists());

        return $token;
    }
}
