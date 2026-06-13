<?php

use App\Modules\Profiles\Http\Controllers\MeController;
use Illuminate\Support\Facades\Route;

Route::middleware('supabase.jwt')->get('/me', MeController::class);
