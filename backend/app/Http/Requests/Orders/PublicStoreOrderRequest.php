<?php

namespace App\Http\Requests\Orders;

use App\Support\ApiResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class PublicStoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'order_type' => ['nullable', 'string', 'in:dine_in,take_away'],
            'qr_token' => ['required_if:order_type,dine_in', 'nullable', 'string', 'exists:tables,qr_token'],
            'customer_name' => ['required', 'string', 'max:255'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.menu_id' => ['required', 'integer', 'exists:menus,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.notes' => ['nullable', 'string', 'max:500'],
            'payment_method' => ['nullable', 'string', 'in:tunai,qris'],
            'payment_proof' => ['nullable', 'image', 'mimes:jpeg,png,jpg', 'max:2048'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'qr_token.required' => 'QR token meja wajib dikirim.',
            'qr_token.exists' => 'QR meja tidak valid atau sudah tidak berlaku.',
            'customer_name.required' => 'Nama pemesan wajib diisi.',
            'items.required' => 'Item pesanan wajib diisi.',
            'items.array' => 'Item pesanan harus berupa array.',
            'items.min' => 'Minimal ada satu item pesanan.',
            'items.*.menu_id.required' => 'Menu wajib dipilih.',
            'items.*.menu_id.exists' => 'Menu tidak ditemukan.',
            'items.*.quantity.required' => 'Jumlah item wajib diisi.',
            'items.*.quantity.integer' => 'Jumlah item harus berupa angka.',
            'items.*.quantity.min' => 'Jumlah item minimal 1.',
            'items.*.notes.max' => 'Catatan item maksimal 500 karakter.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            ApiResponse::error('Validasi gagal', 422, $validator->errors()->toArray())
        );
    }
}
