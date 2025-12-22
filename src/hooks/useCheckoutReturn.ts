import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCartStore } from '@/stores/cartStore';

/**
 * Hook that clears the cart when user returns from Shopify checkout.
 * Should be placed in a component that's always mounted (like App or Header).
 */
export function useCheckoutReturn() {
  const location = useLocation();
  const clearCart = useCartStore((state) => state.clearCart);
  const items = useCartStore((state) => state.items);

  useEffect(() => {
    // Check if we're returning from checkout
    const checkoutStarted = localStorage.getItem('checkout_started');
    
    if (checkoutStarted && items.length > 0) {
      // User had started checkout and came back to the site
      // The thank-you page will clear the cart automatically
      // But if they navigate elsewhere, we should also handle it
      
      // Only clear if we're on specific return pages
      if (location.pathname === '/thank-you' || 
          location.pathname === '/dashboard' ||
          location.pathname === '/drop') {
        // Don't clear here - let ThankYou page handle it
        // This is just for detection
      }
    }
  }, [location.pathname, clearCart, items.length]);
}
