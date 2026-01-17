import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const appUrl = Deno.env.get("APP_URL") || "https://konvertaos.lovable.app";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting NPS scheduled send...");

    // 1. Verificar se NPS está ativo
    const { data: config, error: configError } = await supabase
      .from("nps_config")
      .select("*")
      .single();

    if (configError) {
      console.error("Error fetching NPS config:", configError);
      throw configError;
    }

    if (!config?.ativo) {
      console.log("NPS is disabled, skipping...");
      return new Response(
        JSON.stringify({ message: "NPS is disabled", enviados: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Calcular data limite para envios recentes
    const mesesAtras = new Date();
    mesesAtras.setMonth(mesesAtras.getMonth() - config.frequencia_meses);

    // 3. Buscar clientes que já receberam NPS recentemente
    const { data: enviosRecentes, error: enviosError } = await supabase
      .from("nps_envios")
      .select("cliente_id")
      .gt("enviado_em", mesesAtras.toISOString());

    if (enviosError) {
      console.error("Error fetching recent sends:", enviosError);
      throw enviosError;
    }

    const clientesComEnvioRecente = new Set(
      enviosRecentes?.map((e) => e.cliente_id) || []
    );

    // 4. Buscar clientes ativos há mais de 30 dias
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

    const { data: clientes, error: clientesError } = await supabase
      .from("clientes")
      .select("id, razao_social, nome_fantasia, email, data_ativacao")
      .eq("status", "ativo")
      .lt("data_ativacao", trintaDiasAtras.toISOString());

    if (clientesError) {
      console.error("Error fetching clients:", clientesError);
      throw clientesError;
    }

    // 5. Filtrar clientes elegíveis
    const clientesElegiveis = clientes?.filter(
      (c) => !clientesComEnvioRecente.has(c.id)
    ) || [];

    console.log(`Found ${clientesElegiveis.length} eligible clients`);

    const enviados: string[] = [];
    const erros: { cliente_id: string; error: string }[] = [];

    // 6. Para cada cliente elegível, criar envio
    for (const cliente of clientesElegiveis) {
      try {
        const token = crypto.randomUUID();
        const expiraEm = new Date();
        expiraEm.setDate(expiraEm.getDate() + 7); // Expira em 7 dias

        // Criar registro de envio
        const { error: insertError } = await supabase
          .from("nps_envios")
          .insert({
            cliente_id: cliente.id,
            token,
            expira_em: expiraEm.toISOString(),
          });

        if (insertError) {
          console.error(`Error creating send for ${cliente.id}:`, insertError);
          erros.push({ cliente_id: cliente.id, error: insertError.message });
          continue;
        }

        const linkPesquisa = `${appUrl}/nps/${token}`;
        const clienteNome = cliente.nome_fantasia || cliente.razao_social;

        // Preparar corpo do email com variáveis substituídas
        const emailCorpo = config.email_corpo
          .replace(/\{\{cliente_nome\}\}/g, clienteNome)
          .replace(/\{\{link_pesquisa\}\}/g, linkPesquisa);

        console.log(`Created NPS send for ${clienteNome}: ${linkPesquisa}`);

        // TODO: Integrar com Resend para envio de email
        // Por enquanto, apenas logamos e marcamos como enviado
        // Se você quiser integrar com Resend, descomente abaixo:
        /*
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (resendApiKey) {
          const resend = new Resend(resendApiKey);
          await resend.emails.send({
            from: "Konverta <nps@seudominio.com>",
            to: [cliente.email],
            subject: config.email_assunto,
            html: emailCorpo.replace(/\n/g, '<br>'),
          });
        }
        */

        enviados.push(cliente.id);
      } catch (err) {
        console.error(`Error processing client ${cliente.id}:`, err);
        erros.push({ cliente_id: cliente.id, error: String(err) });
      }
    }

    console.log(`NPS send complete. Sent: ${enviados.length}, Errors: ${erros.length}`);

    return new Response(
      JSON.stringify({
        message: "NPS send completed",
        enviados: enviados.length,
        erros: erros.length,
        detalhes: { enviados, erros },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in NPS scheduled send:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
