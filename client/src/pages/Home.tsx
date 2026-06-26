import { Button } from "@/components/ui/button";
import { Dumbbell, Zap, Target, TrendingUp, Apple, Calendar, ChevronRight, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/clerk-react";

const isClerkConfigured = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

function StartButton({ size = "default", className, children }: { size?: "default" | "lg"; className?: string; children?: React.ReactNode }) {
  if (!isClerkConfigured) {
    return (
      <Button size={size} disabled className={className}>
        {children ?? (
          <>
            Comenzar <ChevronRight className="w-4 h-4" />
          </>
        )}
      </Button>
    );
  }

  return (
    <SignedOut>
      <SignInButton mode="modal">
        <Button size={size} className={className}>
          {children ?? (
            <>
              Comenzar <ChevronRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </SignInButton>
    </SignedOut>
  );
}

function DashboardButton({ size = "default", className, label }: { size?: "default" | "lg"; className?: string; label: string }) {
  const [, navigate] = useLocation();

  if (!isClerkConfigured) {
    return null;
  }

  return (
    <SignedIn>
      <Button size={size} onClick={() => navigate("/dashboard")} className={className}>
        {label} <ChevronRight className="w-4 h-4" />
      </Button>
    </SignedIn>
  );
}

function HomeWithClerk() {
  const { user, isLoaded } = useUser();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isLoaded && user) {
      navigate("/dashboard");
    }
  }, [isLoaded, user, navigate]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return <HomeContent />;
}

export default function Home() {
  if (isClerkConfigured) {
    return <HomeWithClerk />;
  }

  return <HomeContent />;
}

function HomeContent() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {!isClerkConfigured && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-accent/10 border-b border-accent/30 px-4 py-2 text-center text-sm text-accent">
          Configura <strong>VITE_CLERK_PUBLISHABLE_KEY</strong> en un archivo <strong>.env</strong> en la raíz del proyecto para habilitar el login.
        </div>
      )}
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-accent-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">EviGym <span className="text-accent">Pro</span></span>
          </div>
        
          <StartButton className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2" />
          <DashboardButton label="Dashboard" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2" />
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent/8 rounded-full blur-3xl" />
        </div>
        <div className="container text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/30 bg-accent/10 text-accent text-sm font-medium mb-8">
            <Zap className="w-4 h-4" />
            Entrenamiento personalizado con IA
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            Domina Cada <span className="text-accent">Serie</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10">
            La plataforma científica de análisis de entrenamiento para atletas que controlan
            cada repetición, cada XP y cada nivel.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <StartButton
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 text-base px-8 glow-green"
            >
              <Zap className="w-5 h-5" />
              Crear mi rutina gratis
            </StartButton>
            <DashboardButton
              size="lg"
              label="Ir al Dashboard"
              className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 text-base px-8 glow-green"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="container">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
            Todo lo que necesitás para <span className="text-accent">transformarte</span>
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            Desde la configuración inicial hasta el seguimiento diario, EviGym Pro te acompaña en cada paso.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Target, title: "Plan personalizado con IA", desc: "El LLM genera tu rutina según tu objetivo, nivel, equipo disponible y limitaciones físicas." },
              { icon: Dumbbell, title: "Guías de ejercicios", desc: "Cada ejercicio incluye GIF animado, instrucciones paso a paso y músculos objetivo desde ExerciseDB." },
              { icon: Apple, title: "Plan nutricional completo", desc: "Macros, comidas sugeridas, hidratación y suplementación calculados según tu TDEE y objetivo." },
              { icon: Zap, title: "Sistema de XP y niveles", desc: "Gana experiencia completando series, mantén tu racha y sube de nivel con cada entrenamiento." },
              { icon: Calendar, title: "Calendario semanal", desc: "Visualizá tus días de entrenamiento activos y el estado de completado de cada sesión." },
              { icon: TrendingUp, title: "Seguimiento de progreso", desc: "Dashboard con estadísticas en tiempo real: XP, nivel, racha y series completadas históricamente." },
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-xl border border-border/50 bg-card hover:border-accent/40 hover:glow-green-sm transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <f.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container">
          <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 to-accent/5 p-12 text-center">
            <h2 className="font-display text-4xl font-bold text-foreground mb-4">
              ¿Listo para empezar?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Completá el wizard de 5 pasos y en menos de un minuto tenés tu plan personalizado.
            </p>
            
            {!isClerkConfigured ? (
              <Button size="lg" disabled className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 glow-green">
                <Zap className="w-5 h-5" />
                Empezar ahora — es gratis
              </Button>
            ) : (
              <>
                <SignedOut>
                  <SignInButton mode="modal">
                    <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 glow-green">
                      <Zap className="w-5 h-5" />
                      Empezar ahora — es gratis
                    </Button>
                  </SignInButton>
                </SignedOut>

                <SignedIn>
                  <Button
                    size="lg"
                    onClick={() => navigate("/dashboard")}
                    className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 glow-green"
                  >
                    <Zap className="w-5 h-5" />
                    Ir al Dashboard
                  </Button>
                </SignedIn>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 px-4">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-accent flex items-center justify-center">
              <Dumbbell className="w-3 h-3 text-accent-foreground" />
            </div>
            <span className="font-display font-bold text-foreground">EviGym Pro</span>
          </div>
          <p className="text-muted-foreground text-sm">© 2025 EviGym Pro. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
