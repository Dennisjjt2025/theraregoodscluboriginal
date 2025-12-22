import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createStorefrontCheckout, getCountryCode, BuyerIdentity } from '@/lib/shopify';
import { supabase } from '@/integrations/supabase/client';

export interface CartItem {
  dropId: string;
  variantId: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
}

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  checkoutUrl: string | null;

  // Actions
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  createCheckout: () => Promise<string>;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

// Helper to fetch user profile for checkout pre-fill
async function getUserBuyerIdentity(): Promise<BuyerIdentity | undefined> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return undefined;

    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, phone, street_address, house_number, postal_code, city, country')
      .eq('id', user.id)
      .single();

    if (!profile) return undefined;

    // Build address line: street + house number
    const address1 = [profile.street_address, profile.house_number]
      .filter(Boolean)
      .join(' ');

    const buyerIdentity: BuyerIdentity = {
      email: user.email,
      phone: profile.phone || undefined,
    };

    // Only add address preferences if we have address data
    if (address1 || profile.city || profile.postal_code) {
      buyerIdentity.deliveryAddressPreferences = [{
        deliveryAddress: {
          firstName: profile.first_name || undefined,
          lastName: profile.last_name || undefined,
          address1: address1 || undefined,
          city: profile.city || undefined,
          zip: profile.postal_code || undefined,
          country: getCountryCode(profile.country),
        },
      }];
    }

    return buyerIdentity;
  } catch (error) {
    console.error('Failed to fetch user profile for checkout:', error);
    return undefined;
  }
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      checkoutUrl: null,

      addItem: (item, quantity = 1) => {
        const { items } = get();
        const existingItem = items.find((i) => i.variantId === item.variantId);

        if (existingItem) {
          set({
            items: items.map((i) =>
              i.variantId === item.variantId
                ? { ...i, quantity: i.quantity + quantity }
                : i
            ),
          });
        } else {
          set({ items: [...items, { ...item, quantity }] });
        }
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }

        set({
          items: get().items.map((item) =>
            item.variantId === variantId ? { ...item, quantity } : item
          ),
        });
      },

      removeItem: (variantId) => {
        set({
          items: get().items.filter((item) => item.variantId !== variantId),
        });
      },

      clearCart: () => {
        set({ items: [], checkoutUrl: null });
      },

      createCheckout: async () => {
        const { items } = get();
        if (items.length === 0) {
          throw new Error('Cart is empty');
        }

        set({ isLoading: true });

        try {
          // Fetch user profile for pre-filling checkout
          const buyerIdentity = await getUserBuyerIdentity();
          
          let checkoutUrl = await createStorefrontCheckout(
            items.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
            })),
            buyerIdentity
          );

          // Add return URL to redirect back to thank you page after checkout
          const returnUrl = `${window.location.origin}/thank-you`;
          const urlObj = new URL(checkoutUrl);
          // Shopify doesn't support return URLs via query params, but we set a flag
          localStorage.setItem('checkout_started', 'true');

          set({ checkoutUrl, isLoading: false });
          return checkoutUrl;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
      },
    }),
    {
      name: 'trgc-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
