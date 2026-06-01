<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\TableController;
use App\Http\Controllers\Api\UserController;

/*
|--------------------------------------------------------------------------
| Public Routes (Tidak butuh token)
|--------------------------------------------------------------------------
*/
Route::post('/login', [AuthController::class, 'login']);
Route::get('/public/tables/{qrToken}', [TableController::class, 'resolveQr'])->name('public.tables.resolve');
Route::get('/public/menus', [MenuController::class, 'publicIndex'])->name('public.menus.index');
Route::post('/public/orders', [OrderController::class, 'publicStore'])->name('public.orders.store');
Route::get('/public/orders/{publicToken}', [OrderController::class, 'publicShow'])->name('public.orders.show');

/*
|--------------------------------------------------------------------------
| Protected Routes (Wajib menyertakan Bearer Token)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    
    // Auth Routes
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::apiResource('categories', CategoryController::class);
    Route::patch('menus/{menu}/toggle-active', [MenuController::class, 'toggleActive']);
    Route::apiResource('menus', MenuController::class);
    Route::patch('tables/{table}/status', [TableController::class, 'updateStatus']);
    Route::post('tables/{table}/regenerate-qr', [TableController::class, 'regenerateQr']);
    Route::apiResource('tables', TableController::class);
    Route::patch('orders/{order}/status', [OrderController::class, 'updateStatus']);
    Route::get('orders/{order}/invoice', [OrderController::class, 'invoice']);
    Route::post('orders/{order}/checkout', [OrderController::class, 'checkout']);
    Route::apiResource('orders', OrderController::class)->only(['index', 'store', 'show', 'update']);
    Route::get('reports/daily', [ReportController::class, 'daily']);
    Route::get('reports/sales', [ReportController::class, 'sales']);
    Route::get('reports/best-selling-menus', [ReportController::class, 'bestSellingMenus']);

    Route::middleware('role:admin')->group(function () {
        Route::apiResource('users', UserController::class);
    });
});
