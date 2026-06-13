<?php

namespace App\Modules\Sellers\Services;

use App\Models\Profile;
use App\Models\SellerVerificationRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SellerVerificationService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function requestVerification(Profile $profile, array $data): SellerVerificationRequest
    {
        if ($profile->verification_status === Profile::VERIFICATION_APPROVED) {
            throw ValidationException::withMessages([
                'profile' => 'This profile is already approved as a seller.',
            ]);
        }

        if ($profile->verification_status === Profile::VERIFICATION_SUSPENDED) {
            throw ValidationException::withMessages([
                'profile' => 'Suspended sellers cannot request verification.',
            ]);
        }

        $hasPendingRequest = SellerVerificationRequest::query()
            ->where('profile_id', $profile->id)
            ->where('status', SellerVerificationRequest::STATUS_PENDING)
            ->exists();

        if ($hasPendingRequest) {
            throw ValidationException::withMessages([
                'profile' => 'This profile already has a pending seller verification request.',
            ]);
        }

        return DB::transaction(function () use ($profile, $data): SellerVerificationRequest {
            $profile->forceFill([
                'verification_status' => Profile::VERIFICATION_PENDING,
            ])->save();

            return SellerVerificationRequest::query()->create([
                'profile_id' => $profile->id,
                'business_name' => $data['business_name'],
                'business_description' => $data['business_description'] ?? null,
                'document_type' => $data['document_type'] ?? null,
                'document_number' => $data['document_number'] ?? null,
                'status' => SellerVerificationRequest::STATUS_PENDING,
                'metadata' => $data['metadata'] ?? [],
            ])->load(['profile', 'reviewer']);
        });
    }

    /**
     * @param  array{status: string, rejection_reason?: string|null}  $data
     */
    public function review(
        SellerVerificationRequest $verificationRequest,
        Profile $reviewer,
        array $data
    ): SellerVerificationRequest {
        return DB::transaction(function () use ($verificationRequest, $reviewer, $data): SellerVerificationRequest {
            /** @var Profile $sellerProfile */
            $sellerProfile = $verificationRequest->profile()->lockForUpdate()->firstOrFail();
            $status = $data['status'];

            $verificationRequest->forceFill([
                'status' => $status,
                'reviewed_by' => $reviewer->id,
                'reviewed_at' => now(),
                'rejection_reason' => $status === SellerVerificationRequest::STATUS_REJECTED
                    ? ($data['rejection_reason'] ?? null)
                    : null,
            ])->save();

            $sellerProfile->forceFill([
                'role' => $status === SellerVerificationRequest::STATUS_REJECTED
                    ? Profile::ROLE_BUYER
                    : Profile::ROLE_SELLER,
                'verification_status' => $status,
            ])->save();

            return $verificationRequest->refresh()->load(['profile', 'reviewer']);
        });
    }
}
