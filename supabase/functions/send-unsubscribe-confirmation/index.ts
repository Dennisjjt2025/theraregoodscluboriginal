import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const UnsubscribeConfirmationSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100).regex(/^[a-zA-ZÀ-ÿ\s\-'@.0-9]+$/).optional(),
  language: z.enum(['en', 'nl']).optional().default('en'),
});

// Default templates as fallback
const defaultTemplates = {
  en: {
    subject: "You've been unsubscribed from The Rare Goods Club",
    message: `Dear {{firstName}},

We're sorry to see you go.

Your email address has been successfully removed from our mailing list. You will no longer receive updates from The Rare Goods Club.

If this was a mistake or you change your mind, you're always welcome to rejoin our community.

We wish you all the best,
The Rare Goods Club Team`
  },
  nl: {
    subject: "Je bent uitgeschreven bij The Rare Goods Club",
    message: `Beste {{firstName}},

We vinden het jammer dat je vertrekt.

Je e-mailadres is succesvol verwijderd uit onze mailinglijst. Je ontvangt geen updates meer van The Rare Goods Club.

Als dit een vergissing was of je van gedachten verandert, ben je altijd welkom om opnieuw lid te worden van onze community.

We wensen je het allerbeste,
Het The Rare Goods Club Team`
  }
};

function getBaseEmailTemplate(content: string, language: string, siteUrl: string): string {
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
    const validationResult = UnsubscribeConfirmationSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.errors);
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validationResult.error.errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, name, language } = validationResult.data;

    console.log(`Sending unsubscribe confirmation to ${email} in ${language}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch email templates from database
    const { data: settings, error: settingsError } = await supabase
      .from('site_settings')
      .select('key, value_en, value_nl')
      .in('key', ['unsubscribe_email_subject', 'unsubscribe_email_message']);

    if (settingsError) {
      console.error("Error fetching settings:", settingsError);
    }

    // Get templates from database or use defaults
    let subject = defaultTemplates[language].subject;
    let messageTemplate = defaultTemplates[language].message;

    if (settings && settings.length > 0) {
      const subjectSetting = settings.find(s => s.key === 'unsubscribe_email_subject');
      const messageSetting = settings.find(s => s.key === 'unsubscribe_email_message');

      if (subjectSetting) {
        const dbSubject = language === 'nl' ? subjectSetting.value_nl : subjectSetting.value_en;
        if (dbSubject) subject = dbSubject;
      }

      if (messageSetting) {
        const dbMessage = language === 'nl' ? messageSetting.value_nl : messageSetting.value_en;
        if (dbMessage) messageTemplate = dbMessage;
      }
    }

    // Get first name from full name or use email prefix
    const firstName = name ? name.split(' ')[0] : email.split('@')[0];

    // Replace placeholders
    const placeholderData = {
      firstName,
      name: name || firstName,
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
    console.log("Unsubscribe confirmation email sent:", emailResult);

    return new Response(
      JSON.stringify({ success: true, message: "Unsubscribe confirmation sent" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending unsubscribe confirmation:", error);
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
