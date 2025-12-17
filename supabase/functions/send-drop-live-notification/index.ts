import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getEmailTemplate = (dropTitle: string, dropPrice: number, dropImage: string | null, siteUrl: string) => {
  const imageHtml = dropImage 
    ? `<tr>
        <td style="padding: 0 40px 24px;">
          <img src="${dropImage}" alt="${dropTitle}" style="width: 100%; max-width: 460px; height: auto; border-radius: 4px;" />
        </td>
      </tr>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f6f3; font-family: Georgia, 'Times New Roman', serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Postcard Container -->
        <table role="presentation" style="max-width: 540px; width: 100%; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          
          <!-- Logo Header -->
          <tr>
            <td style="padding: 32px 40px 24px; text-align: center; background-color: #1a1a1a;">
              <h1 style="margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 28px; font-weight: 500; color: #f8f6f3; letter-spacing: 3px;">
                THE RARE GOODS CLUB
              </h1>
              <p style="margin: 8px 0 0; font-size: 11px; color: #888888; letter-spacing: 2px; text-transform: uppercase;">
                Est. 2024 • Invitation Only
              </p>
            </td>
          </tr>
          
          <!-- LIVE Badge -->
          <tr>
            <td style="padding: 24px 40px 0; text-align: center;">
              <span style="display: inline-block; padding: 8px 20px; background-color: #8B3A3A; color: #ffffff; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; font-weight: 600;">
                🔴 DROP IS NU LIVE
              </span>
            </td>
          </tr>
          
          <!-- Drop Title -->
          <tr>
            <td style="padding: 24px 40px 16px; text-align: center;">
              <h2 style="margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 28px; font-weight: 500; color: #1a1a1a; line-height: 1.3;">
                ${dropTitle}
              </h2>
              <p style="margin: 12px 0 0; font-size: 20px; color: #2D4A3E; font-weight: 600;">
                €${dropPrice}
              </p>
            </td>
          </tr>
          
          <!-- Drop Image -->
          ${imageHtml}
          
          <!-- Message -->
          <tr>
            <td style="padding: 16px 40px 24px; text-align: center;">
              <p style="margin: 0; font-size: 16px; line-height: 1.7; color: #4a4a4a;">
                Je hebt interesse getoond in deze drop. Hij is nu beschikbaar!<br/>
                <strong>Bestel snel voordat het op is.</strong>
              </p>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 32px; text-align: center;">
              <a href="${siteUrl}/drop" style="display: inline-block; padding: 14px 32px; background-color: #1a1a1a; color: #f8f6f3; text-decoration: none; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; font-weight: 500;">
                BEKIJK DROP →
              </a>
            </td>
          </tr>
          
          <!-- Decorative Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="border-bottom: 1px solid #e5e2de;"></td>
                  <td style="padding: 0 16px; text-align: center;">
                    <span style="font-size: 18px; color: #c0b8a8;">✦</span>
                  </td>
                  <td style="border-bottom: 1px solid #e5e2de;"></td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- TRGC Stamp Footer -->
          <tr>
            <td style="padding: 32px 40px; text-align: center;">
              <table role="presentation" style="margin: 0 auto; border-collapse: collapse;">
                <tr>
                  <td style="padding: 16px 24px; border: 2px solid #8B3A3A; text-align: center; border-radius: 50%;">
                    <p style="margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 14px; font-weight: 600; color: #8B3A3A; letter-spacing: 2px;">
                      TRGC
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f8f6f3; text-align: center; border-top: 1px solid #e5e2de;">
              <p style="margin: 0 0 8px; font-size: 11px; color: #888888; letter-spacing: 1px;">
                Je ontvangt dit omdat je interesse hebt geregistreerd voor deze drop.
              </p>
              <p style="margin: 0; font-size: 11px; color: #aaaaaa;">
                © ${new Date().getFullYear()} The Rare Goods Club. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check - require admin role
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing authorization' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify the user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      console.error("Auth error:", authError?.message || "No user found");
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check admin role
    const { data: isAdmin, error: roleError } = await supabaseAdmin
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });
    
    if (roleError || !isAdmin) {
      console.error("Role check failed:", roleError?.message || "User is not admin");
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Parse input
    const { drop_id } = await req.json();
    
    if (!drop_id) {
      return new Response(
        JSON.stringify({ error: 'Missing drop_id' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Admin ${user.email} sending drop live notifications for drop: ${drop_id}`);

    // Get drop details
    const { data: drop, error: dropError } = await supabaseAdmin
      .from('drops')
      .select('*')
      .eq('id', drop_id)
      .single();

    if (dropError || !drop) {
      console.error("Error fetching drop:", dropError);
      return new Response(
        JSON.stringify({ error: 'Drop not found' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get all interested users who haven't been notified yet
    const { data: interests, error: interestsError } = await supabaseAdmin
      .from('drop_interests')
      .select('id, email, user_id')
      .eq('drop_id', drop_id)
      .is('notified_at', null);

    if (interestsError) {
      console.error("Error fetching interests:", interestsError);
      throw new Error("Failed to fetch interested users");
    }

    if (!interests || interests.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          sent: 0, 
          message: 'No users to notify (all already notified or none interested)' 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${interests.length} interested users to notify`);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const siteUrl = Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '') || 'https://theraregoodsclub.com';
    
    // Use a better site URL - derive from the request origin or use a configured value
    const origin = req.headers.get('origin') || 'https://theraregoodsclub.com';
    
    const dropTitle = drop.title_nl || drop.title_en;
    const htmlContent = getEmailTemplate(dropTitle, drop.price, drop.image_url, origin);

    // Send emails and track results
    const results = [];
    const successfulIds: string[] = [];

    for (const interest of interests) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "The Rare Goods Club <onboarding@resend.dev>",
            to: [interest.email],
            subject: `🔴 ${dropTitle} is nu LIVE!`,
            html: htmlContent,
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          console.error(`Failed to send to ${interest.email}:`, errorData);
          results.push({ email: interest.email, success: false, error: errorData.message });
        } else {
          const result = await emailResponse.json();
          console.log(`Email sent to ${interest.email}:`, result.id);
          results.push({ email: interest.email, success: true, id: result.id });
          successfulIds.push(interest.id);
        }
      } catch (err: any) {
        console.error(`Error sending to ${interest.email}:`, err);
        results.push({ email: interest.email, success: false, error: err.message });
      }
    }

    // Mark successful notifications as notified
    if (successfulIds.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('drop_interests')
        .update({ notified_at: new Date().toISOString() })
        .in('id', successfulIds);

      if (updateError) {
        console.error("Error updating notified_at:", updateError);
      } else {
        console.log(`Marked ${successfulIds.length} interests as notified`);
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        failed: failCount,
        total: interests.length,
        results 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-drop-live-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
