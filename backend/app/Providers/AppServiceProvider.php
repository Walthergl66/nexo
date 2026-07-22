<?php

namespace App\Providers;

use Illuminate\Support\Facades\DB;
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
        // migrate:fresh, migrate:refresh, migrate:reset y db:wipe vacian la base
        // entera. Se bloquean cuando DB_PROTECTED esta activo o el entorno es
        // produccion. Los tests quedan exentos a proposito: phpunit.xml los manda
        // a sqlite en memoria y RefreshDatabase necesita poder recrear esa base.
        DB::prohibitDestructiveCommands(
            ! $this->app->runningUnitTests()
                && ($this->app->isProduction() || config('database.protected')),
        );
    }
}
