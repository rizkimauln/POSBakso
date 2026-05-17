<?php

namespace App\Enums;

enum PaymentStatus: string
{
    case Lunas = 'lunas';
    case BelumLunas = 'belum_lunas';

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
