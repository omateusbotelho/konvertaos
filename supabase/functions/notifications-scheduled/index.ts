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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const em24Horas = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const em1Hora = new Date(now.getTime() + 60 * 60 * 1000);
    
    const resultados = {
      tarefasVencendo: 0,
      reunioesProximas: 0,
    };

    // 1. Tarefas vencendo em 24 horas
    console.log("Verificando tarefas vencendo em 24h...");
    
    const { data: tarefasVencendo, error: tarefasError } = await supabase
      .from("tarefas")
      .select("id, titulo, responsavel_id, data_vencimento")
      .eq("concluida", false)
      .gte("data_vencimento", now.toISOString())
      .lte("data_vencimento", em24Horas.toISOString())
      .not("responsavel_id", "is", null);

    if (tarefasError) {
      console.error("Erro ao buscar tarefas:", tarefasError);
    } else if (tarefasVencendo && tarefasVencendo.length > 0) {
      console.log(`Encontradas ${tarefasVencendo.length} tarefas vencendo`);
      
      for (const tarefa of tarefasVencendo) {
        // Verificar se já enviou notificação de prazo para esta tarefa hoje
        const { data: notificacaoExistente } = await supabase
          .from("notificacoes")
          .select("id")
          .eq("usuario_id", tarefa.responsavel_id)
          .eq("tipo", "tarefa_prazo")
          .contains("dados", { tarefa_id: tarefa.id })
          .gte("created_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
          .single();

        if (!notificacaoExistente) {
          const horasRestantes = Math.round(
            (new Date(tarefa.data_vencimento!).getTime() - now.getTime()) / (60 * 60 * 1000)
          );

          const { error: insertError } = await supabase.from("notificacoes").insert({
            usuario_id: tarefa.responsavel_id,
            tipo: "tarefa_prazo",
            titulo: "Tarefa vencendo em breve",
            mensagem: `"${tarefa.titulo}" vence em ${horasRestantes}h`,
            link: `/tarefas?id=${tarefa.id}`,
            dados: { tarefa_id: tarefa.id },
          });

          if (insertError) {
            console.error("Erro ao criar notificação de tarefa:", insertError);
          } else {
            resultados.tarefasVencendo++;
          }
        }
      }
    }

    // 2. Reuniões em 1 hora
    console.log("Verificando reuniões em 1 hora...");
    
    const { data: reunioesProximas, error: reunioesError } = await supabase
      .from("reunioes")
      .select(`
        id, 
        titulo, 
        data_inicio,
        reuniao_participantes (participante_id)
      `)
      .eq("status", "agendada")
      .gte("data_inicio", now.toISOString())
      .lte("data_inicio", em1Hora.toISOString());

    if (reunioesError) {
      console.error("Erro ao buscar reuniões:", reunioesError);
    } else if (reunioesProximas && reunioesProximas.length > 0) {
      console.log(`Encontradas ${reunioesProximas.length} reuniões próximas`);
      
      for (const reuniao of reunioesProximas) {
        const participantes = reuniao.reuniao_participantes || [];
        
        for (const participante of participantes) {
          // Verificar se já enviou lembrete para esta reunião
          const { data: lembreteExistente } = await supabase
            .from("notificacoes")
            .select("id")
            .eq("usuario_id", participante.participante_id)
            .eq("tipo", "reuniao_lembrete")
            .contains("dados", { reuniao_id: reuniao.id })
            .single();

          if (!lembreteExistente) {
            const minutosRestantes = Math.round(
              (new Date(reuniao.data_inicio).getTime() - now.getTime()) / (60 * 1000)
            );

            const { error: insertError } = await supabase.from("notificacoes").insert({
              usuario_id: participante.participante_id,
              tipo: "reuniao_lembrete",
              titulo: "Reunião em breve",
              mensagem: `"${reuniao.titulo}" começa em ${minutosRestantes} minutos`,
              link: `/calendario?reuniao=${reuniao.id}`,
              dados: { reuniao_id: reuniao.id },
            });

            if (insertError) {
              console.error("Erro ao criar notificação de reunião:", insertError);
            } else {
              resultados.reunioesProximas++;
            }
          }
        }
      }
    }

    console.log("Resultados:", resultados);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notificações processadas com sucesso",
        resultados,
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
