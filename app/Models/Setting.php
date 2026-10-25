<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $guarded = [];

    protected $casts = [
        'password_changed' => 'boolean',
    ];

    public static function current(): self
    {
        return static::query()->firstOrFail();
    }
}
