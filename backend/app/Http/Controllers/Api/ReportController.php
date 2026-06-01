<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reports\DailyReportRequest;
use App\Http\Requests\Reports\DateRangeReportRequest;
use App\Http\Resources\OrderResource;
use App\Http\Resources\TableResource;
use App\Models\Order;
use App\Models\Table;
use App\Services\ReportService;
use App\Support\ApiResponse;

class ReportController extends Controller
{
    public function __construct(private readonly ReportService $reportService)
    {
    }

    public function daily(DailyReportRequest $request)
    {
        if ($request->boolean('dashboard')) {
            return ApiResponse::success('Dashboard berhasil diambil', [
                'daily_report' => $this->reportService->daily(),
                'best_selling_items' => $this->reportService->bestSellingMenus()['items'],
                'orders' => OrderResource::collection(
                    Order::query()->with(['table', 'user'])->latest()->limit(5)->get()
                ),
                'tables' => TableResource::collection(
                    Table::query()->withCount('orders')->latest()->get()
                ),
                'unpaid_orders' => OrderResource::collection(
                    Order::query()
                        ->with(['table', 'user'])
                        ->where('payment_status', 'belum_lunas')
                        ->latest()
                        ->get()
                ),
            ]);
        }

        return ApiResponse::success(
            'Laporan harian berhasil diambil',
            $this->reportService->daily(
                $request->validated('date'),
                $request->validated('payment_method')
            )
        );
    }

    public function sales(DateRangeReportRequest $request)
    {
        return ApiResponse::success(
            'Laporan penjualan berhasil diambil',
            $this->reportService->salesSummary(
                $request->validated('from'),
                $request->validated('to'),
                $request->validated('payment_method')
            )
        );
    }

    public function bestSellingMenus(DateRangeReportRequest $request)
    {
        return ApiResponse::success(
            'Laporan menu terlaris berhasil diambil',
            $this->reportService->bestSellingMenus(
                $request->validated('from'),
                $request->validated('to'),
                $request->validated('payment_method')
            )
        );
    }
}
