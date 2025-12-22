import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShopifyOrderNode {
  id: string;
  name: string;
  createdAt: string;
  fulfillmentStatus: string;
  financialStatus: string;
  totalPrice: {
    amount: string;
    currencyCode: string;
  };
  shippingAddress: {
    address1: string;
    city: string;
    country: string;
    zip: string;
  } | null;
  lineItems: {
    edges: Array<{
      node: {
        title: string;
        quantity: number;
        variant: {
          price: {
            amount: string;
          };
        } | null;
      };
    }>;
  };
  fulfillments: Array<{
    status: string;
    trackingInfo: Array<{
      number: string;
      url: string;
    }>;
    deliveredAt: string | null;
    estimatedDeliveryAt: string | null;
  }>;
}

const GET_ORDER_QUERY = `
  query getOrder($id: ID!) {
    order(id: $id) {
      id
      name
      createdAt
      fulfillmentStatus
      financialStatus
      totalPrice {
        amount
        currencyCode
      }
      shippingAddress {
        address1
        city
        country
        zip
      }
      lineItems(first: 10) {
        edges {
          node {
            title
            quantity
            variant {
              price {
                amount
              }
            }
          }
        }
      }
      fulfillments {
        status
        trackingInfo {
          number
          url
        }
        deliveredAt
        estimatedDeliveryAt
      }
    }
  }
`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const { shopify_order_ids } = await req.json();
    
    if (!shopify_order_ids || !Array.isArray(shopify_order_ids)) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get Shopify credentials
    const shopifyAccessToken = Deno.env.get('SHOPIFY_ACCESS_TOKEN');
    const shopifyStoreDomain = Deno.env.get('SHOPIFY_STORE_DOMAIN') || 'the-rare-goods-club.myshopify.com';

    if (!shopifyAccessToken) {
      console.error('SHOPIFY_ACCESS_TOKEN not configured');
      return new Response(JSON.stringify({ error: 'Shopify not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch order details from Shopify Admin API
    const orderDetails: Record<string, any> = {};

    for (const orderId of shopify_order_ids) {
      try {
        // Convert numeric order ID to Shopify GID format
        const shopifyOrderGid = `gid://shopify/Order/${orderId}`;
        
        const response = await fetch(
          `https://${shopifyStoreDomain}/admin/api/2025-01/graphql.json`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': shopifyAccessToken,
            },
            body: JSON.stringify({
              query: GET_ORDER_QUERY,
              variables: { id: shopifyOrderGid },
            }),
          }
        );

        if (!response.ok) {
          console.error(`Failed to fetch order ${orderId}:`, response.status);
          continue;
        }

        const data = await response.json();
        
        if (data.errors) {
          console.error(`GraphQL errors for order ${orderId}:`, data.errors);
          continue;
        }

        if (data.data?.order) {
          const order = data.data.order as ShopifyOrderNode;
          orderDetails[orderId] = {
            orderNumber: order.name,
            createdAt: order.createdAt,
            fulfillmentStatus: order.fulfillmentStatus,
            financialStatus: order.financialStatus,
            totalPrice: order.totalPrice,
            trackingInfo: order.fulfillments?.[0]?.trackingInfo || [],
            deliveredAt: order.fulfillments?.[0]?.deliveredAt,
            estimatedDeliveryAt: order.fulfillments?.[0]?.estimatedDeliveryAt,
          };
        }
      } catch (error) {
        console.error(`Error fetching order ${orderId}:`, error);
      }
    }

    console.log(`Fetched details for ${Object.keys(orderDetails).length} orders`);

    return new Response(JSON.stringify({ orders: orderDetails }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching order details:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
