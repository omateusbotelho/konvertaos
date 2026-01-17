import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Usar anon key em vez da service role key
    // A lógica de notificação é executada via RPC com SECURITY DEFINER
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    console.log("Iniciando processamento de notificações agendadas...");

    // Chamar a função RPC que executa com SECURITY DEFINER
    // Isso garante que a lógica seja executada com segurança no servidor
    const { data, error } = await supabase.rpc("process_scheduled_notifications");

    if (error) {
      console.error("Erro ao processar notificações:", error);
      throw error;
    }

    console.log("Resultados:", data);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notificações processadas com sucesso",
        resultados: {
          tarefasVencendo: data?.tarefas_vencendo || 0,
          reunioesProximas: data?.reunioes_proximas || 0,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro na edge function:", errorMessage);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
