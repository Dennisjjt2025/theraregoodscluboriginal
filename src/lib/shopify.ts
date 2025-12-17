// Shopify Storefront API Configuration
export const SHOPIFY_API_VERSION = '2025-07';
export const SHOPIFY_STORE_PERMANENT_DOMAIN = 'lovable-project-hxhh1.myshopify.com';
export const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
export const SHOPIFY_STOREFRONT_TOKEN = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN || '';

// GraphQL mutation for creating a cart (checkout)
const CART_CREATE_MUTATION = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        totalQuantity
        cost {
          totalAmount {
            amount
            currencyCode
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Helper function for Storefront API requests
export async function storefrontApiRequest<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(`Shopify GraphQL error: ${data.errors.map((e: { message: string }) => e.message).join(', ')}`);
  }

  return data;
}

// Create a checkout and return the URL
export async function createStorefrontCheckout(
  items: Array<{ variantId: string; quantity: number }>
): Promise<string> {
  const lines = items.map((item) => ({
    quantity: item.quantity,
    merchandiseId: item.variantId,
  }));

  const response = await storefrontApiRequest<{
    data: {
      cartCreate: {
        cart: { checkoutUrl: string } | null;
        userErrors: Array<{ field: string; message: string }>;
      };
    };
  }>(CART_CREATE_MUTATION, { input: { lines } });

  if (response.data.cartCreate.userErrors.length > 0) {
    throw new Error(
      `Cart creation failed: ${response.data.cartCreate.userErrors.map((e) => e.message).join(', ')}`
    );
  }

  const cart = response.data.cartCreate.cart;
  if (!cart?.checkoutUrl) {
    throw new Error('No checkout URL returned from Shopify');
  }

  // Add channel parameter for proper checkout
  const url = new URL(cart.checkoutUrl);
  url.searchParams.set('channel', 'online_store');
  
  return url.toString();
}
