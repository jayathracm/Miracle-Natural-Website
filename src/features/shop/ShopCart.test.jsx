// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, within, cleanup } from '@testing-library/react';
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
    isWholesaleEligible: false,
    moqViolations: [],
    onChangeQuantity: vi.fn(),
    onClearCart: vi.fn(),
    openSignal: 1,
    ...overrides,
  };
}

// ShopCart always mounts both the desktop panel and the mobile sheet at
// once — only a CSS media query (which jsdom doesn't apply) picks which one
// is actually visible. Every query is scoped to the desktop panel via its
// data-testid so it matches one element instead of the same content twice.
function renderCart(overrides = {}) {
  const props = baseProps(overrides);
  const utils = render(<ShopCart {...props} />);
  const panel = within(utils.getByTestId('cart-panel-desktop'));
  return { ...utils, props, panel };
}

describe('ShopCart — quantity buttons', () => {
  it('the + button calls onChangeQuantity(id, +1) for the right line', async () => {
    const user = userEvent.setup();
    const { props, panel } = renderCart();

    await user.click(panel.getByLabelText('Increase quantity for Neem Face Oil'));

    expect(props.onChangeQuantity).toHaveBeenCalledWith('p2', 1);
    expect(props.onChangeQuantity).toHaveBeenCalledTimes(1);
  });

  it('the - button calls onChangeQuantity(id, -1) for the right line', async () => {
    const user = userEvent.setup();
    const { props, panel } = renderCart();

    await user.click(panel.getByLabelText('Decrease quantity for Aloe Vera Gel'));

    expect(props.onChangeQuantity).toHaveBeenCalledWith('p1', -1);
  });
});

describe('ShopCart — totals', () => {
  it('renders subtotal, shipping and grand total from props, formatted as currency', () => {
    const { panel } = renderCart();

    expect(panel.getByText('LKR 2,500')).toBeInTheDocument();
    expect(panel.getByText('LKR 300')).toBeInTheDocument();
    expect(panel.getByText('LKR 2,800')).toBeInTheDocument();
  });

  it('recomputes what it displays when the parent passes updated totals', () => {
    const { rerender, props, getByTestId } = renderCart();
    let panel = within(getByTestId('cart-panel-desktop'));
    expect(panel.getByText('LKR 2,800')).toBeInTheDocument();

    rerender(
      <ShopCart
        {...props}
        cartItems={[{ ...baseItems[0], quantity: 3 }, baseItems[1]]}
        totalItems={4}
        subtotal={3500}
        grandTotal={3800}
      />
    );

    panel = within(getByTestId('cart-panel-desktop'));
    expect(panel.queryByText('LKR 2,800')).not.toBeInTheDocument();
    expect(panel.queryByText('LKR 2,500')).not.toBeInTheDocument();
    expect(panel.getByText('LKR 3,500')).toBeInTheDocument();
    expect(panel.getByText('LKR 3,800')).toBeInTheDocument();
  });
});

describe('ShopCart — MOQ violations', () => {
  it('enables Checkout when there are no violations', () => {
    const { panel } = renderCart();
    expect(panel.getByRole('button', { name: 'Checkout' })).not.toBeDisabled();
  });

  it('disables Checkout and shows a warning when there is a violation', () => {
    const { panel } = renderCart({
      moqViolations: [{ item: baseItems[0], pricing: { moq: 5 } }],
    });

    const checkoutButton = panel.getByRole('button', { name: 'Adjust Quantities to Continue' });
    expect(checkoutButton).toBeDisabled();
    expect(panel.getByText('Minimum order quantity not met')).toBeInTheDocument();
    expect(panel.getByText('Aloe Vera Gel: need 5, have 2')).toBeInTheDocument();
  });
});
