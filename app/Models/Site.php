<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Site extends Model
{
    use HasUuids;

    protected $guarded = [];

    protected $casts = [
        'require_signature' => 'boolean',
        'active' => 'boolean',
        'last_tested_at' => 'datetime',
        'last_test_ok' => 'boolean',
    ];
}
