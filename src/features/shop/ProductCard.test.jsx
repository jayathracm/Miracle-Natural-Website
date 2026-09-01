// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCard } from './ProductCard';

afterEach(() => cleanup());

const baseProduct = {
  id: 'p1',
  name: 'Aloe Vera Gel',
  price: 1200,
  size: '50ml',
  image: null,
};

// Renders one card with sensible defaults, all handlers mocked. Returns the
// mocks so a test can assert on how they were called.
function renderCard(productOverrides = {}, extra = {}) {
  const product = { ...baseProduct, ...productOverrides };
  const onAddToCart = vi.fn();
  const onToggleWishlist = vi.fn();
  const onOpenDetail = vi.fn();

  render(
    <ProductCard
      product={product}
      category="Face Care"
      quantity={extra.quantity ?? 0}
      isWishlisted={extra.isWishlisted ?? false}
      onAddToCart={onAddToCart}
      onToggleWishlist={onToggleWishlist}
      onOpenDetail={onOpenDetail}
      view={extra.view ?? 'grid'}
    />
  );

  return { product, onAddToCart, onToggleWishlist, onOpenDetail };
}

describe('ProductCard — sale badge', () => {
  it('shows "Sale" when compare_at_price is genuinely higher than price', () => {
    renderCard({ compare_at_price: 1500 });
    expect(screen.getByText('Sale')).toBeInTheDocument();
  });

  it('hides "Sale" when there is no compare_at_price', () => {
    renderCard();
    expect(screen.queryByText('Sale')).not.toBeInTheDocument();
  });

  it('hides "Sale" when compare_at_price equals price', () => {
    renderCard({ compare_at_price: 1200 });
    expect(screen.queryByText('Sale')).not.toBeInTheDocument();
  });

  it('hides "Sale" when compare_at_price is lower than price', () => {
    renderCard({ compare_at_price: 900 });
    expect(screen.queryByText('Sale')).not.toBeInTheDocument();
  });
});

describe('ProductCard — add to cart', () => {
  it('fires onAddToCart with the product id, and does not also open the detail modal', async () => {
    const user = userEvent.setup();
    const { onAddToCart, onOpenDetail } = renderCard();

    await user.click(screen.getByLabelText('Add Aloe Vera Gel to cart'));

    expect(onAddToCart).toHaveBeenCalledTimes(1);
    expect(onAddToCart).toHaveBeenCalledWith('p1');
    expect(onOpenDetail).not.toHaveBeenCalled();
  });

  it('shows the quantity badge once the item is in the cart', () => {
    renderCard({}, { quantity: 3 });
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows no quantity badge when quantity is 0', () => {
    renderCard({}, { quantity: 0 });
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});

describe('ProductCard — wishlist heart', () => {
  it('fires onToggleWishlist with the product id, and does not also open the detail modal', async () => {
    const user = userEvent.setup();
    const { onToggleWishlist, onOpenDetail } = renderCard();

    await user.click(screen.getByLabelText('Add Aloe Vera Gel to wishlist'));

    expect(onToggleWishlist).toHaveBeenCalledWith('p1');
    expect(onOpenDetail).not.toHaveBeenCalled();
  });

  it('label and fill flip between "add" and "remove" based on isWishlisted', () => {
    renderCard({}, { isWishlisted: true });
    const removeButton = screen.getByLabelText('Remove Aloe Vera Gel from wishlist');
    expect(removeButton.querySelector('svg')).toHaveAttribute('fill', 'currentColor');

    cleanup();

    renderCard({}, { isWishlisted: false });
    const addButton = screen.getByLabelText('Add Aloe Vera Gel to wishlist');
    expect(addButton.querySelector('svg')).toHaveAttribute('fill', 'none');
  });
});

describe('ProductCard — list view', () => {
  it('fires the same handlers as grid view', async () => {
    const user = userEvent.setup();
    const { onAddToCart, onToggleWishlist } = renderCard({}, { view: 'list' });

    await user.click(screen.getByLabelText('Add Aloe Vera Gel to cart'));
    await user.click(screen.getByLabelText('Add Aloe Vera Gel to wishlist'));

    expect(onAddToCart).toHaveBeenCalledWith('p1');
    expect(onToggleWishlist).toHaveBeenCalledWith('p1');
  });

  it('shows "Sale" in list view too when there is a real discount', () => {
    renderCard({ compare_at_price: 1500 }, { view: 'list' });
    expect(screen.getByText('Sale')).toBeInTheDocument();
  });
});
