<?php

namespace App\Http\Controllers\Api;

use App\Actions\Orders\CheckoutOrderAction;
use App\Actions\Orders\CreateOrderAction;
use App\Events\OrderCreated;
use App\Events\OrderStatusUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Orders\CheckoutOrderRequest;
use App\Http\Requests\Orders\PublicStoreOrderRequest;
use App\Http\Requests\Orders\StoreOrderRequest;
use App\Http\Requests\Orders\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Table;
use App\Models\User;
use App\Services\OrderService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function __construct(
        private readonly OrderService $orderService,
        private readonly CreateOrderAction $createOrderAction,
        private readonly CheckoutOrderAction $checkoutOrderAction
    ) {
    }

    public function index(Request $request)
    {
        $perPage = min((int) $request->integer('per_page', 10), 100);

        $orders = $this->orderService->paginate(
            $request->only(['order_status', 'payment_status', 'table_id']),
            $perPage
        );

        return OrderResource::collection($orders)
            ->additional([
                'status' => 'success',
                'message' => 'Data order berhasil diambil',
            ]);
    }

    public function store(StoreOrderRequest $request)
    {
        $table = Table::query()->findOrFail($request->validated('table_id'));

        /** @var User|null $user */
        $user = $request->user();

        try {
            $order = $this->createOrderAction->execute($table, $request->validated('items'), $user);
        } catch (ValidationException $exception) {
            return ApiResponse::error('Validasi gagal', 422, $exception->errors());
        }

        event(new OrderCreated($order));

        return ApiResponse::success(
            'Order berhasil dibuat',
            new OrderResource($order),
            201
        );
    }

    public function publicStore(PublicStoreOrderRequest $request)
    {
        $table = Table::query()
            ->where('qr_token', $request->validated('qr_token'))
            ->firstOrFail();

        try {
            $order = $this->createOrderAction->execute($table, $request->validated('items'));
        } catch (ValidationException $exception) {
            return ApiResponse::error('Validasi gagal', 422, $exception->errors());
        }

        event(new OrderCreated($order));

        return ApiResponse::success(
            'Order berhasil dibuat',
            new OrderResource($order),
            201
        );
    }

    public function publicShow(string $publicToken)
    {
        $order = Order::query()
            ->where('public_token', $publicToken)
            ->first();

        if (! $order) {
            return ApiResponse::error('Order tidak ditemukan.', 404);
        }

        return ApiResponse::success(
            'Status order berhasil diambil',
            new OrderResource($this->orderService->findDetailed($order))
        );
    }

    public function show(Order $order)
    {
        return ApiResponse::success(
            'Detail order berhasil diambil',
            new OrderResource($this->orderService->findDetailed($order))
        );
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Order $order)
    {
        $order = $this->orderService->updateStatus($order, $request->validated('order_status'));

        event(new OrderStatusUpdated($order));

        return ApiResponse::success(
            'Status order berhasil diperbarui',
            new OrderResource($order)
        );
    }

    public function invoice(Order $order)
    {
        return ApiResponse::success(
            'Invoice order berhasil diambil',
            new OrderResource($this->orderService->findDetailed($order))
        );
    }

    public function checkout(CheckoutOrderRequest $request, Order $order)
    {
        try {
            $order = $this->checkoutOrderAction->execute($order, $request->validated('payment_method'));
        } catch (ValidationException $exception) {
            return ApiResponse::error('Validasi gagal', 422, $exception->errors());
        }

        return ApiResponse::success(
            'Checkout berhasil diproses',
            new OrderResource($order)
        );
    }
}
