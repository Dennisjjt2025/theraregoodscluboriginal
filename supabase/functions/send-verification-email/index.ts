import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schemas
const VerificationRequestSchema = z.object({
  email: z.string().email().max(255),
  firstName: z.string().min(1).max(100).regex(/^[a-zA-ZÀ-ÿ\s\-']+$/),
  userId: z.string().uuid(),
  language: z.enum(['en', 'nl']).optional().default('en'),
});

interface EmailTemplate {
  subject: string;
  message: string;
}

const defaultTemplates = {
  en: {
    subject: "Verify your email - The Rare Goods Club",
    message: `Welcome, {{firstName}}

Thank you for joining The Rare Goods Club. To complete your registration and activate your membership, please verify your email address.

Click the button below to verify your email:`,
  },
  nl: {
    subject: "Bevestig je e-mail - The Rare Goods Club",
    message: `Welkom, {{firstName}}

Bedankt voor je aanmelding bij The Rare Goods Club. Om je registratie te voltooien en je lidmaatschap te activeren, bevestig je e-mailadres.

Klik op de onderstaande knop om je e-mail te bevestigen:`,
  },
};

async function getEmailTemplate(supabaseAdmin: any, language: string): Promise<EmailTemplate> {
  try {
    const { data: settings, error } = await supabaseAdmin
      .from("site_settings")
      .select("key, value_en, value_nl")
      .in("key", ["welcome_email_subject", "welcome_email_message"]);

    if (error) {
      console.error("Error fetching email templates:", error);
      return defaultTemplates[language as keyof typeof defaultTemplates] || defaultTemplates.en;
    }

    const subjectSetting = settings?.find((s: any) => s.key === "welcome_email_subject");
    const messageSetting = settings?.find((s: any) => s.key === "welcome_email_message");

    const isNl = language === "nl";
    const subject = isNl 
      ? (subjectSetting?.value_nl || defaultTemplates.nl.subject)
      : (subjectSetting?.value_en || defaultTemplates.en.subject);
    const message = isNl
      ? (messageSetting?.value_nl || defaultTemplates.nl.message)
      : (messageSetting?.value_en || defaultTemplates.en.message);

    return { subject, message };
  } catch (err) {
    console.error("Error in getEmailTemplate:", err);
    return defaultTemplates[language as keyof typeof defaultTemplates] || defaultTemplates.en;
  }
}

function replacePlaceholders(text: string, replacements: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return result;
}

function getBaseEmailTemplate(content: string, language: string, siteUrl: string): string {
  const unsubscribeText = language === "nl" ? "Uitschrijven" : "Unsubscribe";
  const unsubscribeUrl = `${siteUrl}/unsubscribe`;
  const logoUrl = `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/drop-media/email-assets/logo.png`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #FAF9F6; font-family: Georgia, 'Times New Roman', serif;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse;">
              <!-- Header with Logo -->
              <tr>
                <td align="center" style="padding-bottom: 30px;">
                  <img src="${logoUrl}" alt="The Rare Goods Club" style="height: 60px; width: auto;" />
                </td>
              </tr>
              
              <!-- Main Content Card -->
              <tr>
                <td style="background-color: #FFFFFF; border: 1px solid #E7E5E4;">
                  ${content}
                </td>
              </tr>
              
              <!-- Footer with Wax Seal -->
              <tr>
                <td align="center" style="padding-top: 30px;">
                  <table role="presentation" style="border-collapse: collapse;">
                    <tr>
                      <td align="center">
                        <div style="width: 60px; height: 60px; background-color: #722F37; border-radius: 50%; text-align: center;">
                          <span style="color: #FAF9F6; font-size: 24px; font-weight: bold; line-height: 60px; display: block;">R</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-top: 20px;">
                        <p style="color: #78716C; font-size: 12px; margin: 0; letter-spacing: 1px;">
                          © ${new Date().getFullYear()} The Rare Goods Club
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-top: 15px;">
                        <a href="${unsubscribeUrl}" style="color: #78716C; font-size: 11px; text-decoration: underline;">
                          ${unsubscribeText}
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    const rawBody = await req.json();
    const validationResult = VerificationRequestSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.errors);
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validationResult.error.errors }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, firstName, userId, language } = validationResult.data;
    
    console.log("Sending verification email to:", email, "language:", language);

    const verificationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify that the userId matches the profile being updated (security check)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      console.error("Profile not found:", profileError);
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

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

    const siteUrl = Deno.env.get("SITE_URL") || "https://preview--raregoodsclub.lovable.app";
    const verificationUrl = `${siteUrl}/auth?verify=${verificationToken}`;

    // Get email template from database
    const template = await getEmailTemplate(supabaseAdmin, language);
    
    // Replace placeholders
    const replacements = {
      firstName,
      verifyLink: verificationUrl,
    };
    
    const emailSubject = replacePlaceholders(template.subject, replacements);
    const emailMessage = replacePlaceholders(template.message, replacements);

    // Convert message to HTML paragraphs
    const messageHtml = emailMessage
      .split("\n\n")
      .map((paragraph) => `<p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #44403C;">${paragraph.replace(/\n/g, "<br>")}</p>`)
      .join("");

    const contentHtml = `
      <div style="padding: 40px;">
        ${messageHtml}
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center">
              <a href="${verificationUrl}" style="display: inline-block; padding: 14px 32px; background-color: #1a1a1a; color: #ffffff; text-decoration: none; font-size: 14px; letter-spacing: 1px; border: none;">
                ${language === "nl" ? "BEVESTIG E-MAIL" : "VERIFY EMAIL"}
              </a>
            </td>
          </tr>
        </table>
        <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #78716C;">
          ${language === "nl" 
            ? "Deze link verloopt over 24 uur. Als je geen account hebt aangemaakt bij The Rare Goods Club, kun je deze e-mail negeren."
            : "This link will expire in 24 hours. If you didn't create an account with The Rare Goods Club, you can safely ignore this email."}
        </p>
      </div>
    `;

    const htmlEmail = getBaseEmailTemplate(contentHtml, language, siteUrl);

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
        subject: emailSubject,
        html: htmlEmail,
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
