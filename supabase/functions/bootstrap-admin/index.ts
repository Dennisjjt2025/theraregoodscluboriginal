import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BootstrapRequest {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  makeAdmin: boolean;
  makeMember: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, firstName, lastName, makeAdmin, makeMember }: BootstrapRequest = await req.json();
    
    console.log("Bootstrapping user:", email);

    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let userId: string;

    // Try to get existing user first
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("Error listing users:", listError);
      throw new Error(listError.message);
    }

    const existingUser = existingUsers.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      console.log("User already exists with ID:", existingUser.id);
      userId = existingUser.id;

      // Update password if provided
      if (password) {
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password,
          email_confirm: true,
        });
        if (updateError) {
          console.error("Error updating password:", updateError);
        } else {
          console.log("Password updated");
        }
      }
    } else {
      // Create the user
      if (!password) {
        throw new Error("Password is required for new users");
      }
      
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
        },
      });

      if (userError) {
        console.error("Error creating user:", userError);
        throw new Error(userError.message);
      }

      userId = userData.user.id;
      console.log("User created with ID:", userId);
    }

    // Upsert profile with verified status
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userId,
        first_name: firstName,
        last_name: lastName,
        email_verified: true,
        verification_token: null,
        verification_token_expires_at: null,
      });

    if (profileError) {
      console.error("Error upserting profile:", profileError);
    } else {
      console.log("Profile updated");
    }

    // Create member record if requested
    if (makeMember) {
      // Check if member exists
      const { data: existingMember } = await supabaseAdmin
        .from("members")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!existingMember) {
        const { error: memberError } = await supabaseAdmin
          .from("members")
          .insert({
            user_id: userId,
            status: "active",
            strike_count: 0,
            invites_remaining: 10,
          });

        if (memberError) {
          console.error("Error creating member:", memberError);
        } else {
          console.log("Member record created");
        }
      } else {
        console.log("Member record already exists");
      }
    }

    // Add admin role if requested
    if (makeAdmin) {
      // Check if role exists
      const { data: existingRole } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (!existingRole) {
        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .insert({
            user_id: userId,
            role: "admin",
          });

        if (roleError) {
          console.error("Error adding admin role:", roleError);
        } else {
          console.log("Admin role added");
        }
      } else {
        console.log("Admin role already exists");
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId,
        message: `User ${email} bootstrapped successfully` 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Bootstrap error:", error);
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