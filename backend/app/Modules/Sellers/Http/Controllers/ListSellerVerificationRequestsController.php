<?php

namespace App\Modules\Sellers\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\SellerVerificationRequest;
use App\Modules\Sellers\Http\Resources\SellerVerificationRequestResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpKernel\Exception\HttpException;

class ListSellerVerificationRequestsController extends Controller
{
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        $profile = $request->attributes->get('profile');

        if (! $profile instanceof Profile || ! $profile->isAdmin()) {
            throw new HttpException(403, 'This action is unauthorized.');
        }

        $requests = SellerVerificationRequest::query()
            ->with(['profile', 'reviewer'])
            ->latest()
            ->paginate(20);

        return SellerVerificationRequestResource::collection($requests);
    }
}
