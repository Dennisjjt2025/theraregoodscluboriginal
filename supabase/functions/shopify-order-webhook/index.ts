import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shopify-topic, x-shopify-hmac-sha256, x-shopify-shop-domain',
};

// Verify Shopify webhook HMAC signature
async function verifyShopifyWebhook(rawBody: string, hmacHeader: string): Promise<boolean> {
  const webhookSecret = Deno.env.get('SHOPIFY_WEBHOOK_SECRET');
  
  if (!webhookSecret) {
    console.warn('SHOPIFY_WEBHOOK_SECRET not set - skipping verification in development');
    return true; // Allow in development without secret
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(rawBody)
    );

    const computedHmac = btoa(String.fromCharCode(...new Uint8Array(signature)));
    return computedHmac === hmacHeader;
  } catch (error) {
    console.error('HMAC verification error:', error);
    return false;
  }
}

interface ShopifyLineItem {
  product_id: number;
  quantity: number;
  title: string;
}

interface ShopifyOrder {
  id: number;
  order_number: number;
  line_items: ShopifyLineItem[];
  financial_status: string;
  created_at: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const hmacHeader = req.headers.get('x-shopify-hmac-sha256') || '';
    const topic = req.headers.get('x-shopify-topic') || '';

    console.log('Received Shopify webhook:', { topic, bodyLength: rawBody.length });

    // Verify webhook signature
    const isValid = await verifyShopifyWebhook(rawBody, hmacHeader);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Only process order creation events
    if (topic !== 'orders/create' && topic !== 'orders/paid') {
      console.log(`Ignoring webhook topic: ${topic}`);
      return new Response(JSON.stringify({ message: 'Ignored topic' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const order: ShopifyOrder = JSON.parse(rawBody);
    console.log('Processing order:', { 
      orderId: order.id, 
      orderNumber: order.order_number,
      lineItemsCount: order.line_items.length 
    });

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Process each line item and update quantity_sold
    const updateResults = [];
    
    for (const lineItem of order.line_items) {
      const shopifyProductId = lineItem.product_id.toString();
      const quantity = lineItem.quantity;

      console.log(`Updating drop for Shopify product ${shopifyProductId}, quantity: ${quantity}`);

      // Find the drop by shopify_product_id and update quantity_sold
      const { data: drop, error: findError } = await supabase
        .from('drops')
        .select('id, quantity_sold, quantity_available, title_en')
        .eq('shopify_product_id', shopifyProductId)
        .single();

      if (findError || !drop) {
        console.warn(`Drop not found for Shopify product ${shopifyProductId}:`, findError?.message);
        updateResults.push({ 
          productId: shopifyProductId, 
          status: 'not_found',
          title: lineItem.title 
        });
        continue;
      }

      const newQuantitySold = (drop.quantity_sold || 0) + quantity;
      
      const { error: updateError } = await supabase
        .from('drops')
        .update({ quantity_sold: newQuantitySold })
        .eq('id', drop.id);

      if (updateError) {
        console.error(`Failed to update drop ${drop.id}:`, updateError);
        updateResults.push({ 
          dropId: drop.id, 
          status: 'update_failed',
          error: updateError.message 
        });
      } else {
        console.log(`Successfully updated drop ${drop.id}: quantity_sold ${drop.quantity_sold} -> ${newQuantitySold}`);
        updateResults.push({ 
          dropId: drop.id, 
          title: drop.title_en,
          status: 'updated',
          previousQuantity: drop.quantity_sold,
          newQuantity: newQuantitySold,
          remaining: drop.quantity_available - newQuantitySold
        });
      }
    }

    console.log('Order processing complete:', updateResults);

    return new Response(JSON.stringify({ 
      success: true, 
      orderId: order.id,
      orderNumber: order.order_number,
      updates: updateResults 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook processing error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
