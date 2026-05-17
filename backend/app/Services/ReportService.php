<?php

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\OrderItem;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class ReportService
{
    /**
     * @return array<string, mixed>
     */
    public function daily(?string $date = null, ?string $paymentMethod = null): array
    {
        $day = CarbonImmutable::parse($date ?? now()->toDateString());

        return $this->salesSummary($day->toDateString(), $day->toDateString(), $paymentMethod);
    }

    /**
     * @return array<string, mixed>
     */
    public function salesSummary(?string $from = null, ?string $to = null, ?string $paymentMethod = null): array
    {
        [$start, $end] = $this->dateRange($from, $to);

        $orders = $this->paidOrdersQuery($start, $end, $paymentMethod);

        $totalOrders = (clone $orders)->count();
        $totalRevenue = (int) (clone $orders)->sum('total_amount');

        $byPaymentMethod = (clone $orders)
            ->select('payment_method', DB::raw('COUNT(*) as total_orders'), DB::raw('SUM(total_amount) as total_revenue'))
            ->groupBy('payment_method')
            ->get()
            ->map(fn ($row): array => [
                'payment_method' => $row->payment_method,
                'total_orders' => (int) $row->total_orders,
                'total_revenue' => (int) $row->total_revenue,
            ])
            ->values();

        return [
            'from' => $start->toDateString(),
            'to' => $end->toDateString(),
            'payment_method' => $paymentMethod,
            'total_orders' => $totalOrders,
            'total_revenue' => $totalRevenue,
            'average_order_value' => $totalOrders > 0 ? (int) floor($totalRevenue / $totalOrders) : 0,
            'by_payment_method' => $byPaymentMethod,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function bestSellingMenus(?string $from = null, ?string $to = null, ?string $paymentMethod = null): array
    {
        [$start, $end] = $this->dateRange($from, $to);

        $items = OrderItem::query()
            ->select(
                'order_items.menu_id',
                'menus.name as menu_name',
                DB::raw('SUM(order_items.quantity) as total_quantity'),
                DB::raw('SUM(order_items.quantity * order_items.price) as total_revenue')
            )
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('menus', 'menus.id', '=', 'order_items.menu_id')
            ->where('orders.payment_status', PaymentStatus::Lunas->value)
            ->whereBetween('orders.created_at', [$start->startOfDay(), $end->endOfDay()])
            ->when($paymentMethod, function ($query, string $paymentMethod): void {
                $query->where('orders.payment_method', $paymentMethod);
            })
            ->groupBy('order_items.menu_id', 'menus.name')
            ->orderByDesc('total_quantity')
            ->limit(10)
            ->get()
            ->map(fn ($row): array => [
                'menu_id' => (int) $row->menu_id,
                'menu_name' => $row->menu_name,
                'total_quantity' => (int) $row->total_quantity,
                'total_revenue' => (int) $row->total_revenue,
            ])
            ->values();

        return [
            'from' => $start->toDateString(),
            'to' => $end->toDateString(),
            'payment_method' => $paymentMethod,
            'items' => $items,
        ];
    }

    private function paidOrdersQuery(CarbonImmutable $start, CarbonImmutable $end, ?string $paymentMethod = null): Builder
    {
        return Order::query()
            ->where('payment_status', PaymentStatus::Lunas->value)
            ->whereBetween('created_at', [$start->startOfDay(), $end->endOfDay()])
            ->when($paymentMethod, function (Builder $query, string $paymentMethod): void {
                $query->where('payment_method', $paymentMethod);
            });
    }

    /**
     * @return array{0: CarbonImmutable, 1: CarbonImmutable}
     */
    private function dateRange(?string $from = null, ?string $to = null): array
    {
        $start = CarbonImmutable::parse($from ?? now()->startOfMonth()->toDateString());
        $end = CarbonImmutable::parse($to ?? now()->toDateString());

        return [$start, $end];
    }
}
