import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Meeting {
  id: string;
  nome: string;
  empresa: string | null;
  data_agendamento: string;
}

interface AgendaRapidaProps {
  meetings: Meeting[];
  isLoading?: boolean;
}

export function AgendaRapida({ meetings, isLoading }: AgendaRapidaProps) {
  if (isLoading) {
    return (
      <Card className="bg-card/50 border-border/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <Badge variant="secondary" className="mb-0.5">
                Hoje: {meetings.length} {meetings.length === 1 ? "reunião" : "reuniões"}
              </Badge>
            </div>
          </div>

          {meetings.length > 0 && (
            <div className="flex-1 flex items-center gap-4 overflow-x-auto px-2">
              {meetings.slice(0, 4).map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex items-center gap-2 text-sm whitespace-nowrap"
                >
                  <span className="font-medium text-primary">
                    {format(new Date(meeting.data_agendamento), "HH:mm", {
                      locale: ptBR,
                    })}
                  </span>
                  <span className="text-muted-foreground">|</span>
                  <span className="truncate max-w-[150px]">
                    {meeting.nome}
                  </span>
                  {meeting.empresa && (
                    <span className="text-muted-foreground text-xs truncate max-w-[100px]">
                      ({meeting.empresa})
                    </span>
                  )}
                </div>
              ))}
              {meetings.length > 4 && (
                <span className="text-xs text-muted-foreground">
                  +{meetings.length - 4} mais
                </span>
              )}
            </div>
          )}

          {meetings.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma reunião agendada para hoje
            </p>
          )}

          <button className="flex items-center gap-1 text-xs text-primary hover:underline">
            Ver agenda completa
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
