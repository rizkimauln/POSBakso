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
        Schema::table('orders', function (Blueprint $table) {
            $table->enum('order_type', ['dine_in', 'take_away'])->default('dine_in')->after('id');
            $table->dropForeign(['table_id']);
            $table->unsignedBigInteger('table_id')->nullable()->change();
            $table->foreign('table_id')->references('id')->on('tables')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('order_type');
            $table->dropForeign(['table_id']);
            $table->unsignedBigInteger('table_id')->nullable(false)->change();
            $table->foreign('table_id')->references('id')->on('tables')->cascadeOnDelete();
        });
    }
};
