import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, cargo, setor, nome, role = "colaborador" } = await req.json();

    // Validações
    if (!email || !password) {
      throw new Error("Email e senha são obrigatórios");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Criar usuário no auth
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome: nome || email.split("@")[0] }
    });

    if (createError) throw createError;

    console.log(`User created: ${userData.user.id} - ${email}`);

    // 2. Atualizar profile com cargo e setor
    if (cargo || setor) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ 
          cargo: cargo || null, 
          setor: setor || null,
          nome: nome || email.split("@")[0]
        })
        .eq("id", userData.user.id);

      if (profileError) {
        console.error("Profile update error:", profileError);
        throw profileError;
      }
      console.log(`Profile updated with cargo: ${cargo}, setor: ${setor}`);
    }

    // 3. Atualizar role se diferente de colaborador
    if (role === "admin") {
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .update({ role: "admin" })
        .eq("user_id", userData.user.id);

      if (roleError) {
        console.error("Role update error:", roleError);
        throw roleError;
      }
      console.log(`Role updated to admin`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: userData.user.id,
        email,
        cargo,
        setor,
        role 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error creating user:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
