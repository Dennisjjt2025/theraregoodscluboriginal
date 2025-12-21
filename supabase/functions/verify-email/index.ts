import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, language = 'en' } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: "Token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("=== VERIFY EMAIL START ===");
    console.log("Token:", token);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Find profile with this token
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, first_name, email, verification_token_expires_at, email_verified")
      .eq("verification_token", token)
      .single();

    if (profileError || !profile) {
      console.error("Profile not found for token:", profileError);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Found profile:", profile.id);

    // Check if already verified
    if (profile.email_verified) {
      console.log("Email already verified");
      return new Response(
        JSON.stringify({ success: true, message: "Email already verified" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check token expiry
    if (profile.verification_token_expires_at) {
      const expiresAt = new Date(profile.verification_token_expires_at);
      if (expiresAt < new Date()) {
        console.error("Token expired at:", expiresAt);
        return new Response(
          JSON.stringify({ success: false, error: "Token has expired" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Mark email as verified and clear token
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        email_verified: true,
        verification_token: null,
        verification_token_expires_at: null,
      })
      .eq("id", profile.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to verify email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Profile updated, email verified");

    // Check if member record already exists
    const { data: existingMember } = await supabaseAdmin
      .from("members")
      .select("id")
      .eq("user_id", profile.id)
      .single();

    if (!existingMember) {
      // Find invite code to get inviter
      const { data: inviteCode } = await supabaseAdmin
        .from("invite_codes")
        .select("member_id")
        .eq("used_by", profile.id)
        .single();

      // Create member record
      const { error: memberError } = await supabaseAdmin
        .from("members")
        .insert({
          user_id: profile.id,
          invited_by: inviteCode?.member_id || null,
          status: "active",
        });

      if (memberError) {
        console.error("Error creating member:", memberError);
        // Don't fail the whole verification, member can be created later
      } else {
        console.log("Member record created");
      }
    } else {
      console.log("Member record already exists");
    }

    // Send welcome email
    try {
      const welcomeResponse = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-welcome-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            email: profile.email,
            firstName: profile.first_name || "Member",
            userId: profile.id,
            language,
          }),
        }
      );

      if (welcomeResponse.ok) {
        console.log("Welcome email sent");
      } else {
        console.error("Failed to send welcome email:", await welcomeResponse.text());
      }
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError);
      // Don't fail verification if welcome email fails
    }

    console.log("=== VERIFY EMAIL SUCCESS ===");

    return new Response(
      JSON.stringify({ success: true, userId: profile.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Verify email error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
