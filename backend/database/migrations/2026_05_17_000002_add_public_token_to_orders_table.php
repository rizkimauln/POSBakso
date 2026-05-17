<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->string('public_token', 64)->nullable()->unique()->after('id');
        });

        DB::table('orders')
            ->whereNull('public_token')
            ->orderBy('id')
            ->each(function ($order): void {
                DB::table('orders')
                    ->where('id', $order->id)
                    ->update(['public_token' => Str::random(48)]);
            });

        DB::statement('ALTER TABLE orders MODIFY public_token VARCHAR(64) NOT NULL');
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropUnique(['public_token']);
            $table->dropColumn('public_token');
        });
    }
};
