import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { addToWishlist, fetchWishlistProductIds, removeFromWishlist } from '../lib/wishlist';

/**
 * Shared wishlist state + optimistic toggle. Used by both the Shop grid and
 * the dedicated product detail page so heart-icon state and the underlying
 * Supabase reads/writes aren't duplicated per page.
 *
 * `onError` is optional — pass a toast/notify callback if the caller wants
 * to surface failures to the user; otherwise failures are silently reverted.
 */
export const useWishlist = ({ onError } = {}) => {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState(() => new Set());

  useEffect(() => {
    let isMounted = true;

    if (!user) {
      setWishlistIds(new Set());
      return undefined;
    }

    fetchWishlistProductIds()
      .then((ids) => {
        if (isMounted) setWishlistIds(new Set(ids));
      })
      .catch(() => {
        // Non-fatal — heart icons just won't reflect saved state this load.
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const toggleWishlist = async (productId) => {
    if (!user) {
      onError?.('Sign in to save items to your wishlist.');
      return;
    }

    const isWishlisted = wishlistIds.has(productId);

    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (isWishlisted) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });

    try {
      if (isWishlisted) {
        await removeFromWishlist(productId);
      } else {
        await addToWishlist(productId);
      }
    } catch {
      setWishlistIds((prev) => {
        const reverted = new Set(prev);
        if (isWishlisted) {
          reverted.add(productId);
        } else {
          reverted.delete(productId);
        }
        return reverted;
      });
      onError?.('Could not update your wishlist. Please try again.');
    }
  };

  return { wishlistIds, toggleWishlist };
};
