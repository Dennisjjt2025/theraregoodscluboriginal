import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schemas
const EmailSchema = z.string().email().max(255);
const SubjectSchema = z.string().min(1).max(200);
const MessageSchema = z.string().min(1).max(10000);
const EmailTypeSchema = z.enum(['strike_warning', 'thank_you', 'drop_update', 'newsletter', 'custom']);
const TypeSchema = z.enum(['individual', 'bulk', 'waitlist']);

const EmailRequestSchema = z.object({
  type: TypeSchema,
  recipients: z.array(EmailSchema).optional(),
  subject: SubjectSchema,
  message: MessageSchema,
  emailType: EmailTypeSchema,
});

const getEmailTemplate = (subject: string, message: string, emailType: string) => {
  // Get appropriate header based on email type
  const getTypeHeader = () => {
    switch (emailType) {
      case 'strike_warning':
        return 'Important Notice';
      case 'thank_you':
        return 'Thank You';
      case 'drop_update':
        return 'New Drop Alert';
      case 'newsletter':
        return 'Club Update';
      default:
        return 'Message from TRGC';
    }
  };

  // Get accent color based on type
  const getAccentColor = () => {
    switch (emailType) {
      case 'strike_warning':
        return '#8B3A3A'; // Burgundy/warning
      case 'thank_you':
        return '#2D4A3E'; // Deep forest green
      case 'drop_update':
        return '#1a1a1a'; // Charcoal
      default:
        return '#2D4A3E';
    }
  };

  const accentColor = getAccentColor();
  const typeHeader = getTypeHeader();

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
          
          <!-- Type Badge -->
          <tr>
            <td style="padding: 24px 40px 0; text-align: center;">
              <span style="display: inline-block; padding: 6px 16px; background-color: ${accentColor}; color: #ffffff; font-size: 10px; letter-spacing: 2px; text-transform: uppercase;">
                ${typeHeader}
              </span>
            </td>
          </tr>
          
          <!-- Subject Line -->
          <tr>
            <td style="padding: 24px 40px 16px; text-align: center; border-bottom: 1px solid #e5e2de;">
              <h2 style="margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 26px; font-weight: 500; color: #1a1a1a; line-height: 1.3;">
                ${subject}
              </h2>
            </td>
          </tr>
          
          <!-- Message Content -->
          <tr>
            <td style="padding: 32px 40px;">
              <div style="font-size: 16px; line-height: 1.7; color: #4a4a4a; white-space: pre-wrap;">
${message}
              </div>
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
                  <td style="padding: 16px 24px; border: 2px solid #1a1a1a; text-align: center;">
                    <p style="margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 14px; font-weight: 600; color: #1a1a1a; letter-spacing: 2px;">
                      TRGC
                    </p>
                    <p style="margin: 4px 0 0; font-size: 8px; color: #888888; letter-spacing: 1px; text-transform: uppercase;">
                      Verified Member
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
                You're receiving this because you're on our exclusive list
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

    // Parse and validate input
    const rawBody = await req.json();
    const validationResult = EmailRequestSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.errors);
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validationResult.error.errors }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { type, recipients, subject, message, emailType } = validationResult.data;
    
    console.log(`Admin ${user.email} sending ${type} email - Type: ${emailType}, Subject: ${subject}`);

    let emailAddresses: string[] = [];

    if (type === 'waitlist') {
      // Get all pending/approved waitlist emails
      const { data: waitlistData, error: waitlistError } = await supabaseAdmin
        .from('waitlist')
        .select('email')
        .in('status', ['pending', 'approved']);
      
      if (waitlistError) {
        console.error("Error fetching waitlist emails:", waitlistError);
        throw new Error("Failed to fetch waitlist emails");
      }
      
      emailAddresses = waitlistData?.map((w: any) => w.email) || [];
      console.log(`Waitlist email to ${emailAddresses.length} people`);
    } else if (type === 'bulk') {
      // Get all active member emails
      const { data: memberData, error: memberError } = await supabaseAdmin
        .rpc('get_member_emails');
      
      if (memberError) {
        console.error("Error fetching member emails:", memberError);
        throw new Error("Failed to fetch member emails");
      }
      
      emailAddresses = memberData?.map((m: any) => m.email) || [];
      console.log(`Bulk email to ${emailAddresses.length} members`);
    } else {
      emailAddresses = recipients || [];
    }

    if (emailAddresses.length === 0) {
      throw new Error("No recipients specified");
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const htmlContent = getEmailTemplate(subject, message, emailType);

    // Send emails
    const results = [];
    for (const email of emailAddresses) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "The Rare Goods Club <hello@connect.theraregoodsclub.com>",
            to: [email],
            subject: subject,
            html: htmlContent,
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          console.error(`Failed to send to ${email}:`, errorData);
          results.push({ email, success: false, error: errorData.message });
        } else {
          const result = await emailResponse.json();
          console.log(`Email sent to ${email}:`, result.id);
          results.push({ email, success: true, id: result.id });
        }
      } catch (err: any) {
        console.error(`Error sending to ${email}:`, err);
        results.push({ email, success: false, error: err.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        failed: failCount,
        results 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-member-email function:", error);
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
