<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    use HasFactory;
    use HasUlids;

    public const FULFILLMENT_PENDING = 'pending';

    public const FULFILLMENT_PROCESSING = 'processing';

    public const FULFILLMENT_PACKED = 'packed';

    public const FULFILLMENT_SHIPPED = 'shipped';

    public const FULFILLMENT_DELIVERED = 'delivered';

    public const FULFILLMENT_CANCELLED = 'cancelled';

    /**
     * Forward-only fulfilment flow the seller walks the item through once paid.
     *
     * @var list<string>
     */
    public const FULFILLMENT_FLOW = [
        self::FULFILLMENT_PROCESSING,
        self::FULFILLMENT_PACKED,
        self::FULFILLMENT_SHIPPED,
        self::FULFILLMENT_DELIVERED,
    ];

    /**
     * @var list<string>
     */
    protected $fillable = [
        'order_id',
        'product_id',
        'store_id',
        'product_name',
        'product_slug',
        'store_name',
        'store_slug',
        'unit_price_cents',
        'quantity',
        'fulfillment_status',
        'subtotal_cents',
        'currency',
        'metadata',
    ];

    /**
     * The status that follows the current one in the fulfilment flow, or null
     * when the item is already delivered or outside the forward flow.
     */
    public function nextFulfillmentStatus(): ?string
    {
        $index = array_search($this->fulfillment_status, self::FULFILLMENT_FLOW, true);

        if ($index === false || $index === count(self::FULFILLMENT_FLOW) - 1) {
            return null;
        }

        return self::FULFILLMENT_FLOW[$index + 1];
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'unit_price_cents' => 'integer',
            'quantity' => 'integer',
            'subtotal_cents' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Order, $this>
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * @return BelongsTo<Store, $this>
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
