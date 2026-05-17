<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('kds.orders', function ($user) {
    return in_array($user->role->value ?? $user->role, ['admin', 'kasir'], true);
});
