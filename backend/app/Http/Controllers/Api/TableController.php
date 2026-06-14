<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tables\StoreTableRequest;
use App\Http\Requests\Tables\UpdateTableRequest;
use App\Http\Requests\Tables\UpdateTableStatusRequest;
use App\Http\Resources\TableResource;
use App\Models\Table;
use App\Services\TableService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class TableController extends Controller
{
    public function __construct(private readonly TableService $tableService)
    {
    }

    public function index(Request $request)
    {
        $perPage = min((int) $request->integer('per_page', 10), 100);

        $tables = $this->tableService->paginate(
            $request->only(['search', 'status']),
            $perPage
        );

        return TableResource::collection($tables)
            ->additional([
                'status' => 'success',
                'message' => 'Data meja berhasil diambil',
            ]);
    }

    public function publicIndex()
    {
        $tables = Table::query()->orderBy('table_number')->get();
        return ApiResponse::success('Data meja berhasil diambil', TableResource::collection($tables));
    }

    public function store(StoreTableRequest $request)
    {
        $table = $this->tableService->create($request->validated());

        return ApiResponse::success(
            'Meja berhasil dibuat',
            new TableResource($table),
            201
        );
    }

    public function show(Table $table)
    {
        return ApiResponse::success(
            'Detail meja berhasil diambil',
            new TableResource($table->loadCount('orders'))
        );
    }

    public function update(UpdateTableRequest $request, Table $table)
    {
        $table = $this->tableService->update($table, $request->validated());

        return ApiResponse::success(
            'Meja berhasil diperbarui',
            new TableResource($table->loadCount('orders'))
        );
    }

    public function destroy(Table $table)
    {
        if ($table->orders()->exists()) {
            return ApiResponse::error('Meja masih memiliki riwayat order dan tidak bisa dihapus.', 422);
        }

        $this->tableService->delete($table);

        return ApiResponse::success('Meja berhasil dihapus');
    }

    public function updateStatus(UpdateTableStatusRequest $request, Table $table)
    {
        $table = $this->tableService->updateStatus($table, $request->validated('status'));

        return ApiResponse::success(
            'Status meja berhasil diperbarui',
            new TableResource($table->loadCount('orders'))
        );
    }

    public function regenerateQr(Table $table)
    {
        $table = $this->tableService->regenerateQrToken($table);

        return ApiResponse::success(
            'QR token meja berhasil dibuat ulang',
            new TableResource($table->loadCount('orders'))
        );
    }

    public function resolveQr(string $qrToken)
    {
        $table = $this->tableService->findByQrToken($qrToken);

        if (! $table) {
            return ApiResponse::error('QR meja tidak valid atau sudah tidak berlaku.', 404);
        }

        return ApiResponse::success(
            'Data meja berhasil diambil',
            new TableResource($table)
        );
    }
}
