<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    use HasUuids;

    protected $guarded = [];

    protected $casts = [
        'content_json' => 'array',
        'tags' => 'array',
        'author' => 'array',
        'outline' => 'array',
        'published_to' => 'array',
        'featured' => 'boolean',
        'published_at' => 'datetime',
        'last_published_at' => 'datetime',
        'received_at' => 'datetime',
    ];

    public function authorName(): string
    {
        return (string) ($this->author['name'] ?? '');
    }

    public function publicPath(): string
    {
        return ($this->kind === 'faq' ? '/faq/' : '/blog/').$this->slug;
    }
}
