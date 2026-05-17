<?php

namespace App\Enums;

enum TableStatus: string
{
    case Kosong = 'kosong';
    case Terisi = 'terisi';
    case MenungguBayar = 'menunggu_bayar';

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
