<?php

namespace App\Http\Requests\Tables;

use App\Enums\TableStatus;
use App\Support\ApiResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class UpdateTableRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $tableId = $this->route('table')?->id;

        return [
            'table_number' => [
                'required',
                'string',
                'max:50',
                Rule::unique('tables', 'table_number')->ignore($tableId),
            ],
            'status' => ['sometimes', Rule::in(TableStatus::values())],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'table_number.required' => 'Nomor meja wajib diisi.',
            'table_number.max' => 'Nomor meja maksimal 50 karakter.',
            'table_number.unique' => 'Nomor meja sudah digunakan.',
            'status.in' => 'Status meja tidak valid.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            ApiResponse::error('Validasi gagal', 422, $validator->errors()->toArray())
        );
    }
}
