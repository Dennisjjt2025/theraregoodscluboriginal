import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationRequest {
  email: string;
  firstName: string;
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, userId }: VerificationRequest = await req.json();
    
    console.log("Sending verification email to:", email);

    // Generate verification token
    const verificationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Store token in profiles
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        verification_token: verificationToken,
        verification_token_expires_at: expiresAt.toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Error storing verification token:", updateError);
      throw new Error("Failed to store verification token");
    }

    // Build verification URL
    const siteUrl = Deno.env.get("SITE_URL") || "https://preview--raregoodsclub.lovable.app";
    const verificationUrl = `${siteUrl}/auth?verify=${verificationToken}`;

    // Send email using Resend API directly
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "The Rare Goods Club <onboarding@resend.dev>",
        to: [email],
        subject: "Verify your email - The Rare Goods Club",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f8f6f3; font-family: Georgia, 'Times New Roman', serif;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" style="max-width: 500px; width: 100%; border-collapse: collapse; background-color: #ffffff; border: 1px solid #e5e2de;">
                    <tr>
                      <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #e5e2de;">
                        <h1 style="margin: 0; font-size: 24px; font-weight: normal; color: #1a1a1a; letter-spacing: 2px;">
                          THE RARE GOODS CLUB
                        </h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: normal; color: #1a1a1a;">
                          Welcome, ${firstName}
                        </h2>
                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                          Thank you for joining The Rare Goods Club. To complete your registration and activate your membership, please verify your email address.
                        </p>
                        <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                          Click the button below to verify your email:
                        </p>
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td align="center">
                              <a href="${verificationUrl}" style="display: inline-block; padding: 14px 32px; background-color: #1a1a1a; color: #ffffff; text-decoration: none; font-size: 14px; letter-spacing: 1px; border: none;">
                                VERIFY EMAIL
                              </a>
                            </td>
                          </tr>
                        </table>
                        <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #888888;">
                          This link will expire in 24 hours. If you didn't create an account with The Rare Goods Club, you can safely ignore this email.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 30px 40px; background-color: #f8f6f3; text-align: center; border-top: 1px solid #e5e2de;">
                        <p style="margin: 0; font-size: 12px; color: #888888;">
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
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Resend API error:", errorData);
      throw new Error(errorData.message || "Failed to send email");
    }

    const emailResult = await emailResponse.json();
    console.log("Email sent successfully:", emailResult);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-verification-email function:", error);
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