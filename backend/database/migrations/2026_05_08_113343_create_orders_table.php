<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('orders', function (Blueprint $table) {
        $table->id();
        $table->string('public_token', 64)->unique();
        $table->foreignId('table_id')->constrained()->cascadeOnDelete();
        // user_id nullable karena pelanggan bisa pesan mandiri via QR
        $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();

        $table->integer('total_amount')->default(0);
        $table->enum('order_status', ['pending', 'diproses', 'selesai'])->default('pending');
        $table->enum('payment_method', ['tunai', 'qris'])->nullable();
        $table->enum('payment_status', ['lunas', 'belum_lunas'])->default('belum_lunas');

        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
