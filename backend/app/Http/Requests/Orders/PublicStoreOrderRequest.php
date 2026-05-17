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
            'qr_token' => ['required', 'string', 'exists:tables,qr_token'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.menu_id' => ['required', 'integer', 'exists:menus,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.notes' => ['nullable', 'string', 'max:500'],
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
