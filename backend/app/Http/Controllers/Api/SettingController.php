<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingController extends Controller
{
    public function index()
    {
        $settings = Setting::all()->pluck('value', 'key');
        
        // Append full URL for qris_image if exists
        if (isset($settings['qris_image']) && $settings['qris_image']) {
            $settings['qris_image_url'] = url(Storage::url($settings['qris_image']));
        }

        return ApiResponse::success('Pengaturan berhasil diambil', $settings);
    }

    public function uploadQris(Request $request)
    {
        $request->validate([
            'qris_image' => ['required', 'image', 'max:2048']
        ]);

        $setting = Setting::firstOrCreate(['key' => 'qris_image']);

        if ($setting->value) {
            Storage::disk('public')->delete($setting->value);
        }

        $path = $request->file('qris_image')->store('settings', 'public');
        
        $setting->value = $path;
        $setting->save();

        return ApiResponse::success('QRIS berhasil diunggah', [
            'qris_image_url' => url(Storage::url($path))
        ]);
    }
}
