import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useNPSEnvioPorToken, useEnviarRespostaNPS } from '@/hooks/useNPS';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import konvertaLogo from '@/assets/konverta-logo.png';

export default function NPSPesquisa() {
  const { token } = useParams<{ token: string }>();
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [comentario, setComentario] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data: envio, isLoading, error } = useNPSEnvioPorToken(token || '');
  const enviarResposta = useEnviarRespostaNPS();

  const handleSubmit = async () => {
    if (selectedScore === null || !token) return;

    try {
      await enviarResposta.mutateAsync({
        token,
        score: selectedScore,
        comentario: comentario.trim() || undefined,
      });
      setSubmitted(true);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getScoreColor = (score: number) => {
    if (score <= 6) return 'bg-red-500 hover:bg-red-600 text-white';
    if (score <= 8) return 'bg-yellow-500 hover:bg-yellow-600 text-white';
    return 'bg-green-500 hover:bg-green-600 text-white';
  };

  const getScoreSelectedColor = (score: number) => {
    if (score <= 6) return 'ring-red-500 bg-red-500 text-white';
    if (score <= 8) return 'ring-yellow-500 bg-yellow-500 text-white';
    return 'ring-green-500 bg-green-500 text-white';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  // Error states
  if (error || !envio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <img src={konvertaLogo} alt="Konverta" className="h-12 mx-auto" />
          <div className="bg-card rounded-lg p-8 shadow-lg border">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-foreground mb-2">
              Link Inválido
            </h1>
            <p className="text-muted-foreground">
              Este link não é válido ou já expirou.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (envio.respondido) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <img src={konvertaLogo} alt="Konverta" className="h-12 mx-auto" />
          <div className="bg-card rounded-lg p-8 shadow-lg border">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-foreground mb-2">
              Pesquisa já respondida
            </h1>
            <p className="text-muted-foreground">
              Você já respondeu esta pesquisa. Obrigado!
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (new Date(envio.expira_em) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <img src={konvertaLogo} alt="Konverta" className="h-12 mx-auto" />
          <div className="bg-card rounded-lg p-8 shadow-lg border">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-foreground mb-2">
              Link Expirado
            </h1>
            <p className="text-muted-foreground">
              Este link de pesquisa expirou.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Thank you screen
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <img src={konvertaLogo} alt="Konverta" className="h-12 mx-auto" />
          <div className="bg-card rounded-lg p-8 shadow-lg border">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Obrigado!
            </h1>
            <p className="text-muted-foreground">
              Seu feedback é muito importante para nós.
              <br />
              Usaremos sua opinião para melhorar cada vez mais nossos serviços.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main survey form
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-xl w-full space-y-6">
        <div className="text-center">
          <img src={konvertaLogo} alt="Konverta" className="h-12 mx-auto mb-6" />
          <h1 className="text-2xl font-semibold text-foreground">
            Como está sua experiência com a Konverta?
          </h1>
        </div>

        <div className="bg-card rounded-lg p-6 md:p-8 shadow-lg border space-y-8">
          <div className="space-y-4">
            <p className="text-center text-muted-foreground">
              Em uma escala de 0 a 10, qual a probabilidade de você recomendar
              nossa agência para um amigo ou colega?
            </p>

            <div className="flex flex-wrap justify-center gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                <button
                  key={score}
                  onClick={() => setSelectedScore(score)}
                  className={`
                    w-10 h-10 md:w-12 md:h-12 rounded-lg font-semibold text-sm md:text-base
                    transition-all duration-200
                    ${selectedScore === score
                      ? `ring-2 ring-offset-2 ${getScoreSelectedColor(score)}`
                      : `bg-muted hover:scale-105 ${getScoreColor(score).replace('bg-', 'hover:bg-').replace('-500', '-100').replace('-600', '-200')} text-foreground`
                    }
                    ${selectedScore === score ? getScoreColor(score) : ''}
                  `}
                >
                  {score}
                </button>
              ))}
            </div>

            <div className="flex justify-between text-xs text-muted-foreground px-2">
              <span>Nada provável</span>
              <span>Muito provável</span>
            </div>
          </div>

          <div className="border-t pt-6 space-y-3">
            <label className="text-sm font-medium text-foreground">
              O que podemos melhorar? <span className="text-muted-foreground">(opcional)</span>
            </label>
            <Textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Conte-nos o que podemos fazer para melhorar sua experiência..."
              rows={4}
              className="resize-none"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={selectedScore === null || enviarResposta.isPending}
            className="w-full"
            size="lg"
          >
            {enviarResposta.isPending ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Enviando...
              </>
            ) : (
              'Enviar Feedback'
            )}
          </Button>

          {enviarResposta.isError && (
            <p className="text-center text-sm text-destructive">
              Erro ao enviar resposta. Por favor, tente novamente.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
