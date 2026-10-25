<?php

use App\Http\Controllers\DeskController;
use App\Http\Controllers\PublicController;
use App\Http\Controllers\V1Controller;
use Illuminate\Support\Facades\Route;

Route::get('/', [PublicController::class, 'home']);
Route::get('/blog', [PublicController::class, 'blog']);
Route::get('/blog/{slug}', [PublicController::class, 'story']);
Route::get('/faq', [PublicController::class, 'faq']);
Route::get('/faq/{slug}', [PublicController::class, 'question']);
Route::get('/login', [PublicController::class, 'login']);
Route::post('/login', [PublicController::class, 'authenticate']);
Route::post('/logout', [PublicController::class, 'logout']);
Route::get('/robots.txt', [PublicController::class, 'robots']);
Route::get('/sitemap.xml', [PublicController::class, 'sitemap']);

Route::middleware('desk')->group(function () {
    Route::get('/desk', [DeskController::class, 'library']);
    Route::post('/desk/posts', [DeskController::class, 'create']);
    Route::post('/desk/posts/{id}/delete', [DeskController::class, 'destroy']);
    Route::get('/desk/compose/{id}', [DeskController::class, 'compose']);
    Route::put('/api/posts/{id}', [DeskController::class, 'save']);
    Route::post('/api/publish', [DeskController::class, 'publish']);
    Route::post('/api/upload', [DeskController::class, 'upload']);
    Route::get('/admin', [DeskController::class, 'admin']);
    Route::post('/admin', [DeskController::class, 'adminAction']);
    Route::post('/admin/sites/{id}/test', [DeskController::class, 'siteTest']);
    Route::post('/admin/sites/{id}', [DeskController::class, 'siteUpdate']);
    Route::post('/admin/sites/{id}/delete', [DeskController::class, 'siteDelete']);
});

Route::middleware('cors.api')->group(function () {
    Route::options('/api/v1/{any}', fn () => response('', 204))->where('any', '.*');
    Route::post('/api/v1/ingest', [V1Controller::class, 'ingest']);
    Route::post('/api/v1/handshake', [V1Controller::class, 'handshake']);
    Route::get('/api/v1/posts', [V1Controller::class, 'posts']);
});
