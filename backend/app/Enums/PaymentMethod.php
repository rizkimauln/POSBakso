<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case Tunai = 'tunai';
    case Qris = 'qris';

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
