<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Review;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index()
    {
        // Get recent 10 reviews with high ratings
        $reviews = Review::query()
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return ApiResponse::success('Data review berhasil diambil', $reviews);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'order_public_token' => ['nullable', 'string', 'exists:orders,public_token'],
            'customer_name' => ['required', 'string', 'max:255'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $orderId = null;
        if (!empty($validated['order_public_token'])) {
            $order = Order::where('public_token', $validated['order_public_token'])->first();
            if ($order) {
                $orderId = $order->id;
                
                // Cek apakah order ini sudah pernah direview
                if (Review::where('order_id', $orderId)->exists()) {
                    return ApiResponse::error('Order ini sudah diberikan ulasan.', 400);
                }
            }
        }

        $review = Review::create([
            'order_id' => $orderId,
            'customer_name' => $validated['customer_name'],
            'rating' => $validated['rating'],
            'comment' => $validated['comment'] ?? null,
        ]);

        return ApiResponse::success('Ulasan berhasil dikirim', $review, 201);
    }
}
