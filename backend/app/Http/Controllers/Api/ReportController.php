<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reports\DailyReportRequest;
use App\Http\Requests\Reports\DateRangeReportRequest;
use App\Services\ReportService;
use App\Support\ApiResponse;

class ReportController extends Controller
{
    public function __construct(private readonly ReportService $reportService)
    {
    }

    public function daily(DailyReportRequest $request)
    {
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
