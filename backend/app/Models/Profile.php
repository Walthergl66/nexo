<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Profile extends Model
{
    use HasFactory;
    use HasUlids;

    public const ROLE_BUYER = 'buyer';

    public const ROLE_SELLER = 'seller';

    public const ROLE_ADMIN = 'admin';

    public const VERIFICATION_PENDING = 'pending';

    public const VERIFICATION_APPROVED = 'approved';

    public const VERIFICATION_REJECTED = 'rejected';

    public const VERIFICATION_SUSPENDED = 'suspended';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'supabase_user_id',
        'email',
        'display_name',
        'avatar_url',
        'role',
        'verification_status',
        'metadata',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function isSeller(): bool
    {
        return $this->role === self::ROLE_SELLER;
    }

    public function isVerifiedSeller(): bool
    {
        return $this->isSeller() && $this->verification_status === self::VERIFICATION_APPROVED;
    }

    /**
     * @return HasMany<SellerVerificationRequest, $this>
     */
    public function sellerVerificationRequests(): HasMany
    {
        return $this->hasMany(SellerVerificationRequest::class);
    }

    /**
     * @return HasOne<Store, $this>
     */
    public function store(): HasOne
    {
        return $this->hasOne(Store::class);
    }

    /**
     * @return HasMany<CartItem, $this>
     */
    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }
}
