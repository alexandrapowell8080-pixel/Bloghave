<?php

namespace App\Providers;

use App\Models\Setting;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        View::composer(['layouts.public', 'layouts.desk'], function ($view) {
            if ($view->offsetExists('desk') && $view->offsetGet('desk')) {
                return;
            }
            if (! Schema::hasTable('settings')) {
                return;
            }
            $view->with('desk', Setting::query()->first());
        });
    }
}
