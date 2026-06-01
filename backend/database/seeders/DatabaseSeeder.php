<?php

namespace Database\Seeders;


use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\TableStatus;
use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Menu;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Table;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        Schema::disableForeignKeyConstraints();

        OrderItem::query()->truncate();
        Order::query()->truncate();
        Menu::query()->truncate();
        Category::query()->truncate();
        Table::query()->truncate();
        User::query()->truncate();

        Schema::enableForeignKeyConstraints();

        $users = $this->seedUsers();
        $categories = $this->seedCategories();
        $menus = $this->seedMenus($categories);
        $tables = $this->seedTables();

        $this->seedOrders($users, $menus, $tables);
    }

    /**
     * @return array<string, User>
     */
    private function seedUsers(): array
    {
        return [
            'admin' => User::query()->create([
                'name' => 'Admin POS Bakso',
                'email' => 'admin@posbakso.test',
                'password' => 'password',
                'role' => UserRole::Admin->value,
            ]),
            'kasir' => User::query()->create([
                'name' => 'Kasir POS Bakso',
                'email' => 'kasir@posbakso.test',
                'password' => 'password',
                'role' => UserRole::Kasir->value,
            ]),
            'kasir_sore' => User::query()->create([
                'name' => 'Kasir Sore',
                'email' => 'kasir.sore@posbakso.test',
                'password' => 'password',
                'role' => UserRole::Kasir->value,
            ]),
        ];
    }

    /**
     * @return array<string, Category>
     */
    private function seedCategories(): array
    {
        $categoryNames = [
            'bakso' => 'Bakso',
            'mie_kuah' => 'Mie & Kuah',
            'minuman' => 'Minuman',
            'tambahan' => 'Tambahan',
            'paket' => 'Paket Hemat',
        ];

        $categories = [];

        foreach ($categoryNames as $key => $name) {
            $categories[$key] = Category::query()->create([
                'name' => $name,
            ]);
        }

        return $categories;
    }

    /**
     * @param array<string, Category> $categories
     * @return array<string, Menu>
     */
    private function seedMenus(array $categories): array
    {
        $menuRows = [
            ['bakso', 'bakso_urat', 'Bakso Urat Jumbo', 'Bakso urat ukuran jumbo dengan kuah kaldu sapi gurih.', 26000],
            ['bakso', 'bakso_halusan', 'Bakso Halus', 'Bakso sapi halus klasik dengan bihun dan sayur.', 19000],
            ['bakso', 'bakso_telor', 'Bakso Telur', 'Bakso isi telur ayam dengan kuah bening hangat.', 24000],
            ['bakso', 'bakso_mercon', 'Bakso Mercon', 'Bakso pedas isi cabai untuk pelanggan penyuka pedas.', 27000],
            ['bakso', 'bakso_campur', 'Bakso Campur Spesial', 'Kombinasi bakso halus, urat, tahu, dan pangsit.', 30000],
            ['mie_kuah', 'mie_ayam', 'Mie Ayam Bakso', 'Mie ayam gurih dengan topping bakso kecil.', 23000],
            ['mie_kuah', 'mie_yamin', 'Mie Yamin Manis', 'Mie yamin manis dengan pangsit dan bakso kecil.', 24000],
            ['mie_kuah', 'soto_mie', 'Soto Mie Bakso', 'Soto mie segar dengan irisan daging dan bakso.', 25000],
            ['minuman', 'es_teh', 'Es Teh Manis', 'Teh manis dingin untuk teman makan bakso.', 6000],
            ['minuman', 'es_jeruk', 'Es Jeruk', 'Jeruk segar dingin.', 9000],
            ['minuman', 'teh_tawar', 'Teh Tawar Hangat', 'Teh tawar hangat.', 4000],
            ['minuman', 'air_mineral', 'Air Mineral', 'Air mineral botol.', 5000],
            ['tambahan', 'pangsit', 'Pangsit Goreng', 'Pangsit renyah untuk tambahan topping.', 5000],
            ['tambahan', 'tahu_bakso', 'Tahu Bakso', 'Tahu isi adonan bakso.', 7000],
            ['tambahan', 'lontong', 'Lontong', 'Potongan lontong pulen.', 5000],
            ['tambahan', 'extra_sambal', 'Extra Sambal', 'Tambahan sambal rawit pedas.', 3000],
            ['paket', 'paket_kasir', 'Paket Kasir Cepat', 'Bakso halus, pangsit, dan es teh.', 27000],
            ['paket', 'paket_keluarga', 'Paket Keluarga', 'Empat porsi bakso campur dan empat es teh.', 128000],
            ['paket', 'paket_komplit', 'Paket Komplit Pedas', 'Bakso mercon, tahu bakso, pangsit, dan es jeruk.', 43000],
            ['bakso', 'bakso_keju', 'Bakso Keju', 'Menu nonaktif untuk menguji filter status menu.', 28000, false],
        ];

        $menus = [];

        foreach ($menuRows as $row) {
            [$categoryKey, $key, $name, $description, $price] = $row;
            $isActive = $row[5] ?? true;

            $menus[$key] = Menu::query()->create([
                'category_id' => $categories[$categoryKey]->id,
                'name' => $name,
                'description' => $description,
                'price' => $price,
                'image_path' => null,
                'is_active' => $isActive,
            ]);
        }

        return $menus;
    }

    /**
     * @return array<string, Table>
     */
    private function seedTables(): array
    {
        $tables = [];

        for ($number = 1; $number <= 12; $number++) {
            $tables['M'.$number] = Table::query()->create([
                'table_number' => 'M'.$number,
                'qr_token' => 'qr-meja-'.str_pad((string) $number, 2, '0', STR_PAD_LEFT),
                'status' => TableStatus::Kosong->value,
            ]);
        }

        return $tables;
    }

    /**
     * @param array<string, User> $users
     * @param array<string, Menu> $menus
     * @param array<string, Table> $tables
     */
    private function seedOrders(array $users, array $menus, array $tables): void
    {
        $now = CarbonImmutable::now();

        $this->createOrder($tables['M1'], $users['kasir'], [
            [$menus['bakso_urat'], 1, 'Kuah dipisah'],
            [$menus['es_teh'], 2, null],
        ], 'pending', PaymentStatus::BelumLunas, null, $now->subMinutes(12));

        $this->createOrder($tables['M2'], null, [
            [$menus['bakso_mercon'], 2, 'Level pedas sedang'],
            [$menus['pangsit'], 2, null],
            [$menus['es_jeruk'], 2, null],
        ], 'diproses', PaymentStatus::BelumLunas, null, $now->subMinutes(25));

        $this->createOrder($tables['M3'], $users['kasir_sore'], [
            [$menus['mie_ayam'], 1, 'Tanpa sawi'],
            [$menus['teh_tawar'], 1, null],
        ], 'selesai', PaymentStatus::BelumLunas, null, $now->subMinutes(40));

        $this->createOrder($tables['M4'], $users['kasir'], [
            [$menus['paket_komplit'], 1, null],
            [$menus['air_mineral'], 1, null],
        ], 'selesai', PaymentStatus::Lunas, PaymentMethod::Qris, $now->subHours(2));

        $this->createOrder($tables['M5'], $users['kasir'], [
            [$menus['bakso_campur'], 2, null],
            [$menus['lontong'], 2, null],
            [$menus['es_teh'], 2, null],
        ], 'selesai', PaymentStatus::Lunas, PaymentMethod::Tunai, $now->subHours(4));

        $this->createOrder($tables['M6'], null, [
            [$menus['paket_keluarga'], 1, 'Untuk dibagi empat mangkuk'],
            [$menus['tahu_bakso'], 4, null],
        ], 'selesai', PaymentStatus::Lunas, PaymentMethod::Qris, $now->subDay()->setTime(19, 10));

        $this->createOrder($tables['M7'], $users['kasir_sore'], [
            [$menus['bakso_telor'], 1, null],
            [$menus['mie_yamin'], 1, 'Sambal terpisah'],
            [$menus['es_jeruk'], 2, null],
        ], 'selesai', PaymentStatus::Lunas, PaymentMethod::Tunai, $now->subDays(2)->setTime(13, 25));

        $this->createOrder($tables['M8'], $users['kasir'], [
            [$menus['bakso_halusan'], 3, null],
            [$menus['pangsit'], 3, null],
            [$menus['es_teh'], 3, null],
        ], 'selesai', PaymentStatus::Lunas, PaymentMethod::Tunai, $now->subDays(5)->setTime(12, 5));

        $tables['M1']->update(['status' => TableStatus::Terisi->value]);
        $tables['M2']->update(['status' => TableStatus::Terisi->value]);
        $tables['M3']->update(['status' => TableStatus::MenungguBayar->value]);
    }

    /**
     * @param array<int, array{0: Menu, 1: int, 2: string|null}> $items
     */
    private function createOrder(
        Table $table,
        ?User $user,
        array $items,
        string $orderStatus,
        PaymentStatus $paymentStatus,
        ?PaymentMethod $paymentMethod,
        CarbonImmutable $createdAt
    ): Order {
        $order = new Order([
            'public_token' => Str::random(48),
            'table_id' => $table->id,
            'user_id' => $user?->id,
            'customer_name' => 'Tamu ' . $table->table_number,
            'total_amount' => collect($items)->sum(fn (array $item): int => $item[0]->price * $item[1]),
            'order_status' => $orderStatus,
            'payment_method' => $paymentMethod?->value,
            'payment_status' => $paymentStatus->value,
        ]);

        $order->created_at = $createdAt;
        $order->updated_at = $createdAt;
        $order->save();

        foreach ($items as [$menu, $quantity, $notes]) {
            $orderItem = new OrderItem([
                'order_id' => $order->id,
                'menu_id' => $menu->id,
                'quantity' => $quantity,
                'price' => $menu->price,
                'notes' => $notes,
            ]);

            $orderItem->created_at = $createdAt;
            $orderItem->updated_at = $createdAt;
            $orderItem->save();
        }

        return $order;
    }
}
