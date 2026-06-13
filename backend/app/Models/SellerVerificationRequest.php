<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SellerVerificationRequest extends Model
{
    use HasFactory;
    use HasUlids;

    public const STATUS_PENDING = Profile::VERIFICATION_PENDING;

    public const STATUS_APPROVED = Profile::VERIFICATION_APPROVED;

    public const STATUS_REJECTED = Profile::VERIFICATION_REJECTED;

    public const STATUS_SUSPENDED = Profile::VERIFICATION_SUSPENDED;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'profile_id',
        'business_name',
        'business_description',
        'document_type',
        'document_number',
        'status',
        'reviewed_by',
        'reviewed_at',
        'rejection_reason',
        'metadata',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'reviewed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Profile, $this>
     */
    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }

    /**
     * @return BelongsTo<Profile, $this>
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'reviewed_by');
    }
}
