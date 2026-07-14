<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasFactory;
    use HasUlids;

    public const TYPE_SALE = 'sale';

    public const TYPE_PAYMENT_CONFIRMED = 'payment_confirmed';

    public const TYPE_ORDER_STATUS = 'order_status';

    public const TYPE_CART_STOCK = 'cart_stock';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'profile_id',
        'type',
        'title',
        'body',
        'data',
        'read_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'data' => 'array',
            'read_at' => 'datetime',
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
     * @param  Builder<Notification>  $query
     */
    public function scopeUnread(Builder $query): void
    {
        $query->whereNull('read_at');
    }
}
