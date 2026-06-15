<?php

namespace App\Http\Controllers\Api;

use App\Actions\Orders\CheckoutOrderAction;
use App\Actions\Orders\CreateOrderAction;
use App\Actions\Orders\UpdateOrderAction;
use App\Events\OrderCompleted;
use App\Events\OrderCreated;
use App\Events\OrderStatusUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Orders\CheckoutOrderRequest;
use App\Http\Requests\Orders\PublicStoreOrderRequest;
use App\Http\Requests\Orders\StoreOrderRequest;
use App\Http\Requests\Orders\UpdateOrderRequest;
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
        private readonly UpdateOrderAction $updateOrderAction,
        private readonly CheckoutOrderAction $checkoutOrderAction
    ) {
    }

    public function index(Request $request)
    {
        $perPage = min((int) $request->integer('per_page', 10), 100);

        $orders = $this->orderService->paginate(
            $request->only(['payment_status', 'order_status', 'table_id']),
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
        $orderType = $request->validated('order_type') ?? 'dine_in';
        $table = null;
        if ($orderType === 'dine_in') {
            $table = Table::query()->findOrFail($request->validated('table_id'));
        }

        /** @var User|null $user */
        $user = $request->user();

        try {
            $order = $this->createOrderAction->execute(
                $table, 
                $request->validated('customer_name'), 
                $request->validated('items'), 
                $request->validated('order_type') ?? 'dine_in',
                $user,
                null,
                null
            );
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
        $orderType = $request->validated('order_type') ?? 'dine_in';
        $table = null;

        if ($orderType === 'dine_in') {
            $table = Table::query()
                ->where('qr_token', $request->validated('qr_token'))
                ->firstOrFail();
        }

        $paymentProofPath = null;
        if ($request->hasFile('payment_proof')) {
            $paymentProofPath = $request->file('payment_proof')->store('payment_proofs', 'public');
        }

        try {
            $order = $this->createOrderAction->execute(
                $table, 
                $request->validated('customer_name'), 
                $request->validated('items'),
                $orderType,
                null,
                $request->validated('payment_method'),
                $paymentProofPath
            );
        } catch (ValidationException $exception) {
            return ApiResponse::error('Validasi gagal', 422, $exception->errors());
        }

        return ApiResponse::success(
            'Order berhasil dibuat',
            new OrderResource($order),
            201
        );
    }

    public function update(UpdateOrderRequest $request, Order $order)
    {
        $orderType = $request->validated('order_type') ?? 'dine_in';
        $table = null;
        if ($orderType === 'dine_in') {
            $table = Table::query()->findOrFail($request->validated('table_id'));
        }

        try {
            $order = $this->updateOrderAction->execute(
                $order,
                $table,
                $request->validated('customer_name'),
                $request->validated('items'),
                $orderType
            );
        } catch (ValidationException $exception) {
            return ApiResponse::error('Validasi gagal', 422, $exception->errors());
        }

        return ApiResponse::success(
            'Order berhasil diperbarui',
            new OrderResource($order)
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

    public function publicPayment(Request $request, string $publicToken)
    {
        $order = Order::query()
            ->where('public_token', $publicToken)
            ->first();

        if (! $order) {
            return ApiResponse::error('Order tidak ditemukan.', 404);
        }

        $validated = $request->validate([
            'payment_method' => ['required', 'string', 'in:tunai,qris'],
            'payment_proof' => ['required_if:payment_method,qris', 'nullable', 'image', 'mimes:jpeg,png,jpg', 'max:2048'],
        ], [
            'payment_method.required' => 'Metode pembayaran wajib dipilih.',
            'payment_method.in' => 'Metode pembayaran tidak valid.',
            'payment_proof.required_if' => 'Bukti pembayaran wajib diunggah untuk metode QRIS.',
            'payment_proof.image' => 'Bukti pembayaran harus berupa gambar.',
        ]);

        $paymentProofPath = $order->payment_proof;
        if ($request->hasFile('payment_proof')) {
            $paymentProofPath = $request->file('payment_proof')->store('payment_proofs', 'public');
        }

        $order->update([
            'payment_method' => $validated['payment_method'],
            'payment_proof' => $paymentProofPath,
        ]);

        event(new OrderCreated($order));

        return ApiResponse::success(
            'Metode pembayaran berhasil disimpan',
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

    public function updateStatus(Request $request, Order $order)
    {
        $validated = $request->validate([
            'order_status' => ['required', 'in:pending,diproses,selesai']
        ]);

        $order->update([
            'order_status' => $validated['order_status']
        ]);

        event(new OrderStatusUpdated($order));

        return ApiResponse::success(
            'Status order berhasil diperbarui',
            new OrderResource($this->orderService->findDetailed($order))
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
            $order = $this->checkoutOrderAction->execute(
                $order,
                $request->validated('payment_method'),
                $request->validated('cash_amount')
            );
        } catch (ValidationException $exception) {
            return ApiResponse::error('Validasi gagal', 422, $exception->errors());
        }

        event(new OrderCompleted($order));

        return ApiResponse::success(
            'Checkout berhasil diproses',
            new OrderResource($order)
        );
    }
}
