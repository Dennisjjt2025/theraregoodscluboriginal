import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const WelcomeRequestSchema = z.object({
  email: z.string().email().max(255),
  firstName: z.string().min(1).max(100),
  userId: z.string().uuid(),
  language: z.enum(['en', 'nl']).optional().default('en'),
});

interface EmailTemplate {
  subject: string;
  message: string;
}

const defaultTemplates = {
  en: {
    subject: "Welcome to The Rare Goods Club",
    message: `Dear {{firstName}},

Your email has been verified and your membership is now active.

Welcome to The Rare Goods Club - an exclusive community for lovers of rare wines, spirits, and culinary treasures.

What awaits you:
• Exclusive drops of rare finds, available only to members
• Early access to limited editions
• The ability to invite others to join our community

Visit your dashboard to discover what's currently available and set your preferences.

We're excited to have you with us.

With warm regards,
The Rare Goods Club`,
  },
  nl: {
    subject: "Welkom bij The Rare Goods Club",
    message: `Beste {{firstName}},

Je e-mail is geverifieerd en je lidmaatschap is nu actief.

Welkom bij The Rare Goods Club - een exclusieve community voor liefhebbers van zeldzame wijnen, spirits en culinaire schatten.

Wat je kunt verwachten:
• Exclusieve drops van zeldzame vondsten, alleen beschikbaar voor leden
• Vroege toegang tot limited editions
• De mogelijkheid om anderen uit te nodigen voor onze community

Bezoek je dashboard om te ontdekken wat er momenteel beschikbaar is en stel je voorkeuren in.

We zijn blij dat je er bij bent.

Met warme groet,
The Rare Goods Club`,
  },
};

async function getEmailTemplate(supabaseAdmin: any, language: string): Promise<EmailTemplate> {
  try {
    const { data: settings, error } = await supabaseAdmin
      .from("site_settings")
      .select("key, value_en, value_nl")
      .in("key", ["welcome_confirmed_email_subject", "welcome_confirmed_email_message"]);

    if (error) {
      console.error("Error fetching email templates:", error);
      return defaultTemplates[language as keyof typeof defaultTemplates] || defaultTemplates.en;
    }

    const subjectSetting = settings?.find((s: any) => s.key === "welcome_confirmed_email_subject");
    const messageSetting = settings?.find((s: any) => s.key === "welcome_confirmed_email_message");

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
    const validationResult = WelcomeRequestSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.errors);
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validationResult.error.errors }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, firstName, userId, language } = validationResult.data;
    
    console.log("Sending welcome email to:", email, "language:", language);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get site URL
    const siteUrl = (Deno.env.get("SITE_URL") || "https://theraregoodsclub.com").replace(/\/+$/, '');
    const dashboardUrl = `${siteUrl}/dashboard`;

    // Get email template from database
    const template = await getEmailTemplate(supabaseAdmin, language);
    
    // Replace placeholders
    const replacements = {
      firstName,
      dashboardLink: dashboardUrl,
    };
    
    const emailSubject = replacePlaceholders(template.subject, replacements);
    const emailMessage = replacePlaceholders(template.message, replacements);

    // Convert message to HTML paragraphs
    const messageHtml = emailMessage
      .split("\n\n")
      .map((paragraph) => {
        // Handle bullet points
        if (paragraph.includes("•")) {
          const lines = paragraph.split("\n");
          const listItems = lines
            .filter(line => line.trim().startsWith("•"))
            .map(line => `<li style="margin: 8px 0; color: #44403C;">${line.replace("•", "").trim()}</li>`)
            .join("");
          return `<ul style="margin: 0 0 20px; padding-left: 20px; list-style-type: none;">${listItems}</ul>`;
        }
        return `<p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #44403C;">${paragraph.replace(/\n/g, "<br>")}</p>`;
      })
      .join("");

    const contentHtml = `
      <div style="padding: 40px;">
        <!-- Celebration header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
          <h1 style="font-family: Georgia, serif; font-size: 24px; color: #1a1a1a; margin: 0;">
            ${language === "nl" ? "Je bent lid!" : "You're a member!"}
          </h1>
        </div>
        
        ${messageHtml}
        
        <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 30px;">
          <tr>
            <td align="center">
              <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 32px; background-color: #1a1a1a; color: #ffffff; text-decoration: none; font-size: 14px; letter-spacing: 1px; border: none;">
                ${language === "nl" ? "GA NAAR DASHBOARD" : "GO TO DASHBOARD"}
              </a>
            </td>
          </tr>
        </table>
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
        from: "The Rare Goods Club <hello@connect.theraregoodsclub.com>",
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
    console.log("Welcome email sent successfully:", emailResult);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
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
