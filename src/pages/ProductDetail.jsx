import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Heart, ImageOff, Minus, Plus, ShoppingBag } from 'lucide-react';
import { Typography } from '../components/ui/Typography';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../hooks/useWishlist';
import { getShopCategory } from '../lib/shopCategories';

const formatCurrency = (amount) => `LKR ${Number(amount).toLocaleString('en-LK')}`;

// Dedicated, deep-linkable product page (/shop/:productId) — separate from
// the Shop grid's quick-view ProductDetailModal, which stays as-is for card
// clicks. This page exists so the Ritual Builder, chatbot, or any other
// surface can link straight to a single product, and so a product has a
// real, shareable URL.
const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { productById, isLoadingProducts, productsError, addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState(null);

  const { wishlistIds, toggleWishlist } = useWishlist({
    onError: (message) => setNotice({ type: 'error', message }),
  });

  const product = productById.get(productId);
  const isWishlisted = product ? wishlistIds.has(product.id) : false;
  const hasSale = Boolean(product?.compare_at_price) && Number(product?.compare_at_price) > Number(product?.price);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product.id, quantity);
    setNotice({ type: 'success', message: `${product.name} added to your cart.` });
  };

  return (
    <div className="pt-28 sm:pt-30 md:pt-32 pb-14 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-[1100px] mx-auto">
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="mb-5 inline-flex items-center gap-1.5 text-[0.8rem] font-semibold text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft size={15} /> Back to Shop
        </button>

        {isLoadingProducts ? (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.1fr] gap-8">
            <Skeleton className="aspect-square w-full" />
            <div className="space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        ) : productsError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-8 text-center text-[0.95rem] text-red-700">
            {productsError}
          </div>
        ) : !product ? (
          <div className="rounded-2xl border border-[var(--color-border-light)] bg-white px-5 py-16 text-center">
            <Typography variant="h4" className="text-foreground mb-2">Product not found</Typography>
            <p className="text-[0.9rem] text-muted-foreground mb-5">
              This product may have been removed or is no longer available.
            </p>
            <Button onClick={() => navigate('/shop')}>Return to Shop</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.1fr] gap-8 sm:gap-10">
            <div className="relative rounded-2xl border border-[var(--color-border-light)] bg-[rgba(247,241,227,0.4)] overflow-hidden aspect-square">
              {product.image ? (
                <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-text-tertiary">
                  <ImageOff size={40} />
                </div>
              )}
              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                className={`absolute top-3 right-3 h-10 w-10 rounded-full inline-flex items-center justify-center backdrop-blur-sm transition-colors ${isWishlisted ? 'bg-white/95 text-red-600' : 'bg-white/70 text-foreground/70 hover:text-red-600 hover:bg-white/95'}`}
              >
                <Heart size={17} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>

            <div>
              <p className="text-[0.66rem] font-bold tracking-[0.16em] uppercase text-accent mb-2">
                {getShopCategory(product)}
              </p>
              <Typography variant="h2" className="text-foreground text-balance mb-1.5">{product.name}</Typography>
              {product.size && <p className="text-[0.86rem] text-muted-foreground mb-3">{product.size}</p>}
              <div className="flex items-baseline gap-3 mb-5">
                <p className="font-display text-[1.9rem] text-primary">{formatCurrency(product.price)}</p>
                {hasSale && (
                  <>
                    <p className="text-[1.1rem] text-text-tertiary line-through">{formatCurrency(product.compare_at_price)}</p>
                    <span className="rounded-md border border-[var(--color-border-medium)] bg-[var(--color-card-bg)] px-2 py-1 text-[0.62rem] font-bold tracking-[0.12em] uppercase text-foreground">
                      Sale
                    </span>
                  </>
                )}
              </div>

              {product.description && (
                <div className="mb-4">
                  <p className="text-[0.66rem] font-semibold tracking-[0.1em] uppercase text-text-secondary mb-1">Overview</p>
                  <p className="text-[0.92rem] leading-relaxed text-muted-foreground">{product.description}</p>
                </div>
              )}

              {product.ingredients && (
                <div className="mb-4">
                  <p className="text-[0.66rem] font-semibold tracking-[0.1em] uppercase text-text-secondary mb-1">Key Ingredients</p>
                  <p className="text-[0.9rem] leading-relaxed text-muted-foreground">{product.ingredients}</p>
                </div>
              )}

              {product.benefits && (
                <div className="mb-6">
                  <p className="text-[0.66rem] font-semibold tracking-[0.1em] uppercase text-text-secondary mb-1">Benefits</p>
                  <p className="text-[0.9rem] leading-relaxed text-muted-foreground">{product.benefits}</p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 mb-5">
                <div className="inline-flex items-center rounded-lg border border-[var(--color-border-medium)] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="h-10 w-10 inline-flex items-center justify-center text-foreground hover:bg-[var(--color-hover-overlay)] transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center text-[0.9rem] font-semibold">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="h-10 w-10 inline-flex items-center justify-center text-foreground hover:bg-[var(--color-hover-overlay)] transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <Button icon={ShoppingBag} className="px-6 py-2.5 text-[0.76rem]" onClick={handleAddToCart}>
                  Add To Cart
                </Button>
              </div>

              {notice && (
                <div
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-[0.84rem] ${
                    notice.type === 'error'
                      ? 'border-red-200 bg-red-50 text-red-700'
                      : 'border-[rgba(95,148,118,0.34)] bg-[rgba(237,250,242,0.7)] text-emerald-800'
                  }`}
                >
                  <span>{notice.message}</span>
                  {notice.type !== 'error' && (
                    <button
                      type="button"
                      onClick={() => navigate('/shop', { state: { openCart: true } })}
                      className="shrink-0 font-semibold underline underline-offset-2"
                    >
                      View Cart
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
