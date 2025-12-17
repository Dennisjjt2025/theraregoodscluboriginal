import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const WaitlistConfirmationSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100).regex(/^[a-zA-ZÀ-ÿ\s\-']+$/),
  language: z.enum(['en', 'nl']).optional().default('en'),
});

// Default templates as fallback
const defaultTemplates = {
  en: {
    subject: "Welcome to The Rare Goods Club Waitlist!",
    message: `Dear {{firstName}},

Thank you for joining The Rare Goods Club waitlist!

We're excited to have you interested in our exclusive community. We carefully curate our membership to ensure the best experience for everyone.

What happens next:
• Your spot on the waitlist is confirmed
• We'll notify you when membership spots become available
• Keep an eye on your inbox for exclusive updates

In the meantime, feel free to explore our story and learn more about what makes The Rare Goods Club special.

Welcome aboard,
The Rare Goods Club Team`
  },
  nl: {
    subject: "Welkom op de wachtlijst van The Rare Goods Club!",
    message: `Beste {{firstName}},

Bedankt voor je aanmelding op de wachtlijst van The Rare Goods Club!

We zijn blij dat je interesse hebt in onze exclusieve community. We selecteren onze leden zorgvuldig om de beste ervaring voor iedereen te garanderen.

Wat gebeurt er nu:
• Je plek op de wachtlijst is bevestigd
• We laten je weten wanneer er lidmaatschapsplekken beschikbaar komen
• Houd je inbox in de gaten voor exclusieve updates

In de tussentijd kun je ons verhaal ontdekken en meer leren over wat The Rare Goods Club bijzonder maakt.

Welkom aan boord,
Het The Rare Goods Club Team`
  }
};

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
                <td style="background-color: #FFFFFF; padding: 40px; border: 1px solid #E7E5E4;">
                  <div style="color: #44403C; font-size: 16px; line-height: 1.8; white-space: pre-line;">
                    ${content}
                  </div>
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

const replacePlaceholders = (template: string, data: Record<string, string>): string => {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    const rawBody = await req.json();
    const validationResult = WaitlistConfirmationSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.errors);
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validationResult.error.errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, name, language } = validationResult.data;

    console.log(`Sending waitlist confirmation to ${email} in ${language}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch email templates from database
    const { data: settings, error: settingsError } = await supabase
      .from('site_settings')
      .select('key, value_en, value_nl')
      .in('key', ['waitlist_email_subject', 'waitlist_email_message']);

    if (settingsError) {
      console.error("Error fetching settings:", settingsError);
    }

    // Get templates from database or use defaults
    let subject = defaultTemplates[language].subject;
    let messageTemplate = defaultTemplates[language].message;

    if (settings && settings.length > 0) {
      const subjectSetting = settings.find(s => s.key === 'waitlist_email_subject');
      const messageSetting = settings.find(s => s.key === 'waitlist_email_message');

      if (subjectSetting) {
        const dbSubject = language === 'nl' ? subjectSetting.value_nl : subjectSetting.value_en;
        if (dbSubject) subject = dbSubject;
      }

      if (messageSetting) {
        const dbMessage = language === 'nl' ? messageSetting.value_nl : messageSetting.value_en;
        if (dbMessage) messageTemplate = dbMessage;
      }
    }

    // Get first name from full name
    const firstName = name.split(' ')[0] || name;

    // Replace placeholders
    const placeholderData = {
      firstName,
      name,
      email,
    };

    subject = replacePlaceholders(subject, placeholderData);
    const message = replacePlaceholders(messageTemplate, placeholderData);

    // Get site URL
    const siteUrl = Deno.env.get("SITE_URL") || "https://preview--raregoodsclub.lovable.app";

    // Generate HTML email
    const htmlContent = getBaseEmailTemplate(message, language, siteUrl);

    // Send email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "The Rare Goods Club <onboarding@resend.dev>",
        to: [email],
        subject: subject,
        html: htmlContent,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Waitlist confirmation email sent:", emailResult);

    return new Response(
      JSON.stringify({ success: true, message: "Waitlist confirmation sent" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending waitlist confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
