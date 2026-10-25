<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('password');
            $table->boolean('password_changed')->default(false);
            $table->string('system_id')->unique();
            $table->string('desk_name');
            $table->string('desk_line');
            $table->timestamps();
        });

        Schema::create('posts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('kind');
            $table->string('title')->default('');
            $table->string('slug')->index();
            $table->text('excerpt')->nullable();
            $table->string('section')->default('');
            $table->longText('content_html')->nullable();
            $table->json('content_json')->nullable();
            $table->string('cover_image')->default('');
            $table->string('cover_caption')->default('');
            $table->json('tags')->nullable();
            $table->json('author')->nullable();
            $table->json('outline')->nullable();
            $table->string('status')->index();
            $table->timestamp('published_at')->nullable();
            $table->timestamp('last_published_at')->nullable();
            $table->timestamp('received_at')->nullable();
            $table->json('published_to')->nullable();
            $table->string('source_system_id')->nullable()->index();
            $table->string('source_post_id')->nullable()->index();
            $table->string('source_desk_name')->nullable();
            $table->unsignedInteger('reading_minutes')->default(0);
            $table->boolean('featured')->default(false);
            $table->unsignedInteger('word_count')->default(0);
            $table->timestamps();
        });

        Schema::create('sites', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('system_id')->unique();
            $table->string('name');
            $table->string('ingest_url')->default('');
            $table->text('outbound_key')->nullable();
            $table->text('inbound_key')->nullable();
            $table->text('hmac_secret')->nullable();
            $table->boolean('require_signature')->default(false);
            $table->text('notes')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamp('last_tested_at')->nullable();
            $table->boolean('last_test_ok')->nullable();
            $table->string('last_test_message')->default('');
            $table->timestamps();
        });

        Schema::create('deliveries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('post_id')->nullable();
            $table->string('post_title')->default('');
            $table->string('system_id');
            $table->string('site_name')->default('');
            $table->string('action');
            $table->boolean('ok')->default(false);
            $table->unsignedSmallInteger('status_code')->nullable();
            $table->text('message')->nullable();
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('pairing_codes', function (Blueprint $table) {
            $table->string('code')->primary();
            $table->timestamp('expires_at');
            $table->timestamp('used_at')->nullable();
            $table->string('used_by')->nullable();
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('authors', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('role')->default('');
            $table->string('email')->default('');
            $table->string('bio')->default('');
            $table->string('avatar_url')->default('');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('authors');
        Schema::dropIfExists('pairing_codes');
        Schema::dropIfExists('deliveries');
        Schema::dropIfExists('sites');
        Schema::dropIfExists('posts');
        Schema::dropIfExists('settings');
    }
};
