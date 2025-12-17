import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createStorefrontCheckout } from '@/lib/shopify';

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
          const checkoutUrl = await createStorefrontCheckout(
            items.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
            }))
          );

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
