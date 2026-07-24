import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ImageOff, ShoppingBag } from 'lucide-react';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { ProductGridSkeleton } from '../ui/Skeleton';
import { fetchWishlist, removeFromWishlist } from '../../lib/wishlist';
import { shopPathForBrand } from '../../lib/brands';
import PRODUCT_IMAGES from '../../data/productImages';

const formatCurrency = (amount) => `LKR ${Number(amount).toLocaleString('en-LK')}`;

const WishlistSection = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const loadWishlist = () => {
    setIsLoading(true);
    return fetchWishlist()
      // A wishlisted product that's been deactivated comes back with
      // `products: null` (RLS only exposes active products) — drop those
      // rather than render a card with no data.
      .then((rows) => setItems(rows.filter((row) => row.products)))
      .catch((fetchError) => setError(fetchError.message || 'Could not load your wishlist.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const handleRemove = async (productId) => {
    setRemovingId(productId);
    try {
      await removeFromWishlist(productId);
      setItems((prev) => prev.filter((item) => item.product_id !== productId));
    } finally {
      setRemovingId(null);
    }
  };

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-8 text-center text-[0.9rem] text-red-700">
        {error}
      </div>
    );
  }

  if (isLoading) {
    return <ProductGridSkeleton count={3} />;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--color-card-border)] bg-white/75 px-5 py-12 text-center text-muted-foreground flex flex-col items-center gap-3">
        <Heart size={26} className="text-text-tertiary" />
        <Typography variant="small">Nothing saved yet — tap the heart icon on any product in the shop to add it here.</Typography>
        <Link to={shopPathForBrand('miracle_natural')} className="mt-1">
          <Button className="px-4 py-2 text-[0.72rem]" icon={ShoppingBag}>Browse Shop</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => {
        const product = item.products;
        const image = PRODUCT_IMAGES[product.id] || product.image_url || null;
        return (
          <div
            key={item.id}
            className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] shadow-[0_10px_24px_rgba(31,44,35,0.06)] overflow-hidden flex flex-col"
          >
            <div className="aspect-[4/3] bg-[rgba(255,251,243,0.9)] overflow-hidden flex items-center justify-center">
              {image ? (
                <img
                  src={image}
                  alt={product.name}
                  className="h-full w-full object-cover object-center"
                  loading="lazy"
                />
              ) : (
                <ImageOff size={24} className="text-text-tertiary" />
              )}
            </div>
            <div className="p-4 flex flex-col flex-1">
              <p className="text-[0.66rem] font-bold tracking-[0.14em] uppercase text-accent mb-1">{product.category}</p>
              <Typography variant="h4" className="text-foreground text-[0.94rem] mb-1 leading-snug">{product.name}</Typography>
              <p className="font-display text-[1.15rem] text-primary mb-3">{formatCurrency(product.price)}</p>

              <div className="mt-auto flex items-center gap-2">
                <Link to={shopPathForBrand(product.brand)} className="flex-1">
                  <Button className="w-full px-3 py-2 text-[0.7rem]" icon={ShoppingBag}>
                    Shop This
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={() => handleRemove(product.id)}
                  disabled={removingId === product.id}
                  aria-label={`Remove ${product.name} from wishlist`}
                  className="h-9 w-9 shrink-0 rounded-lg border border-[var(--color-border-medium)] inline-flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Heart size={15} fill="currentColor" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WishlistSection;
