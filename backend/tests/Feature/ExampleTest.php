<?php

namespace Tests\Feature;

// use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * A basic test example.
     */
    public function test_login_validation_returns_api_error_response(): void
    {
        $response = $this->postJson('/api/login', []);

        $response
            ->assertStatus(422)
            ->assertJsonPath('status', 'error')
            ->assertJsonPath('message', 'Validasi gagal')
            ->assertJsonStructure([
                'errors' => [
                    'email',
                    'password',
                ],
            ]);
    }

    public function test_categories_endpoint_requires_authentication(): void
    {
        $response = $this->getJson('/api/categories');

        $response->assertUnauthorized();
    }

    public function test_menus_endpoint_requires_authentication(): void
    {
        $response = $this->getJson('/api/menus');

        $response->assertUnauthorized();
    }

    public function test_tables_endpoint_requires_authentication(): void
    {
        $response = $this->getJson('/api/tables');

        $response->assertUnauthorized();
    }

    public function test_orders_endpoint_requires_authentication(): void
    {
        $response = $this->getJson('/api/orders');

        $response->assertUnauthorized();
    }

    public function test_order_checkout_endpoint_requires_authentication(): void
    {
        $response = $this->postJson('/api/orders/1/checkout', [
            'payment_method' => 'tunai',
        ]);

        $response->assertUnauthorized();
    }

    public function test_kds_orders_endpoint_requires_authentication(): void
    {
        $response = $this->getJson('/api/kds/orders');

        $response->assertUnauthorized();
    }

    public function test_reports_endpoint_requires_authentication(): void
    {
        $response = $this->getJson('/api/reports/daily');

        $response->assertUnauthorized();
    }

    public function test_users_endpoint_requires_authentication(): void
    {
        $response = $this->getJson('/api/users');

        $response->assertUnauthorized();
    }

    public function test_public_order_validation_returns_api_error_response(): void
    {
        $response = $this->postJson('/api/public/orders', []);

        $response
            ->assertStatus(422)
            ->assertJsonPath('status', 'error')
            ->assertJsonPath('message', 'Validasi gagal')
            ->assertJsonStructure([
                'errors' => [
                    'qr_token',
                    'items',
                ],
            ]);
    }
}
