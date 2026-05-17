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
    Schema::create('order_items', function (Blueprint $table) {
        $table->id();
        $table->foreignId('order_id')->constrained()->cascadeOnDelete();
        $table->foreignId('menu_id')->constrained()->cascadeOnDelete();

        $table->integer('quantity');
        // Snapshot harga saat dipesan, untuk antisipasi jika harga menu berubah di masa depan
        $table->integer('price');
        $table->text('notes')->nullable()->comment('Catatan khusus dari pelanggan');

        // Status per item untuk mempermudah koki di Kitchen Display System
        $table->enum('item_status', ['pending', 'dimasak', 'selesai'])->default('pending');

        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
