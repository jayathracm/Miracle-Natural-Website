// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShopCart } from './ShopCart';

afterEach(() => cleanup());

const baseItems = [
  { id: 'p1', name: 'Aloe Vera Gel', price: 1000, quantity: 2, image: null },
  { id: 'p2', name: 'Neem Face Oil', price: 500, quantity: 1, image: null },
];

// `openSignal` truthy forces the drawer open on mount (same mechanism the
// real FAB uses), so we can assert on cart contents without a click first.
function baseProps(overrides = {}) {
  return {
    cartItems: baseItems,
    totalItems: 3,
    subtotal: 2500,
    shippingCost: 300,
    deliveryZoneLabel: 'Colombo 1-15',
    grandTotal: 2800,
    bundleSavings: null,
    isWholesaleEligible: false,
    moqViolations: [],
    onChangeQuantity: vi.fn(),
    onClearCart: vi.fn(),
    openSignal: 1,
    ...overrides,
  };
}

function renderCart(overrides = {}) {
  const props = baseProps(overrides);
  const utils = render(<ShopCart {...props} />);
  return { ...utils, props };
}

describe('ShopCart — quantity buttons', () => {
  it('the + button calls onChangeQuantity(id, +1) for the right line', async () => {
    const user = userEvent.setup();
    const { props } = renderCart();

    await user.click(screen.getByLabelText('Increase quantity for Neem Face Oil'));

    expect(props.onChangeQuantity).toHaveBeenCalledWith('p2', 1);
    expect(props.onChangeQuantity).toHaveBeenCalledTimes(1);
  });

  it('the - button calls onChangeQuantity(id, -1) for the right line', async () => {
    const user = userEvent.setup();
    const { props } = renderCart();

    await user.click(screen.getByLabelText('Decrease quantity for Aloe Vera Gel'));

    expect(props.onChangeQuantity).toHaveBeenCalledWith('p1', -1);
  });
});

describe('ShopCart — totals', () => {
  it('renders subtotal, shipping and grand total from props, formatted as currency', () => {
    renderCart();

    expect(screen.getByText('LKR 2,500')).toBeInTheDocument();
    expect(screen.getByText('LKR 300')).toBeInTheDocument();
    expect(screen.getByText('LKR 2,800')).toBeInTheDocument();
  });

  it('recomputes what it displays when the parent passes updated totals', () => {
    const { rerender, props } = renderCart();
    expect(screen.getByText('LKR 2,800')).toBeInTheDocument();

    rerender(
      <ShopCart
        {...props}
        cartItems={[{ ...baseItems[0], quantity: 3 }, baseItems[1]]}
        totalItems={4}
        subtotal={3500}
        grandTotal={3800}
      />
    );

    expect(screen.queryByText('LKR 2,800')).not.toBeInTheDocument();
    expect(screen.queryByText('LKR 2,500')).not.toBeInTheDocument();
    expect(screen.getByText('LKR 3,500')).toBeInTheDocument();
    expect(screen.getByText('LKR 3,800')).toBeInTheDocument();
  });
});

describe('ShopCart — MOQ violations', () => {
  it('enables Checkout when there are no violations', () => {
    renderCart();
    expect(screen.getByRole('button', { name: 'Checkout' })).not.toBeDisabled();
  });

  it('disables Checkout and shows a warning when there is a violation', () => {
    renderCart({
      moqViolations: [{ item: baseItems[0], pricing: { moq: 5 } }],
    });

    const checkoutButton = screen.getByRole('button', { name: 'Adjust Quantities to Continue' });
    expect(checkoutButton).toBeDisabled();
    expect(screen.getByText('Minimum order quantity not met')).toBeInTheDocument();
    expect(screen.getByText('Aloe Vera Gel: need 5, have 2')).toBeInTheDocument();
  });
});
