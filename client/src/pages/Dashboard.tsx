import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useUser } from "@clerk/clerk-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardLayout from "@/components/DashboardLayout";
import { TrainingPlanSelector } from "@/components/TrainingPlanSelector";
import { Zap, Flame, Trophy, TrendingUp, Dumbbell, Calendar, Plus, CheckCircle2, Circle, ChevronRight, Star } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { getLevelProgress } from "@/lib/levels";

const DAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAYS_FULL = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function Dashboard() {
  const { user } = useUser();
  const [, navigate] = useLocation();
  const [wizardOpen, setWizardOpen] = useState(false);
  const utils = trpc.useUtils();

  const { data: planData, isLoading: planLoading } = trpc.training.getActivePlan.useQuery();
  const { data: progress, isLoading: progressLoading } = trpc.training.getUserProgress.useQuery();
  const { data: checklist } = trpc.training.getTodayChecklist.useQuery();
  const generateDemo = trpc.training.generateDemoRoutine.useMutation();

  const hasPlan = planData && (planData as any).hasPlan;
  const xpToNextLevel = ((progress?.level || 1) * 500);
  const xpProgress = progress ? ((progress.totalXP % 500) / 500) * 100 : 0;
  const todayIndex = new Date().getDay();

  const handlePlanCreated = () => {
  setWizardOpen(false);
  // Refresca los datos del dashboard para que 'hasPlan' pase a ser true
  utils.training.getActivePlan.invalidate(); 
  toast.success("¡Plan creado exitosamente!");
};

  const handleGenerateDemo = async () => {
    try {
      await generateDemo.mutateAsync();
      toast.success("¡Rutina de demo generada!");
      handlePlanCreated();
    } catch {
      toast.error("Error al generar la rutina de demo");
    }
  };

  const planWithContent = planData as any;
  const generatedPlan = hasPlan && planWithContent?.generatedContent
    ? (typeof planWithContent.generatedContent === "string" ? JSON.parse(planWithContent.generatedContent) : planWithContent.generatedContent)
    : null;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Welcome */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Hola, <span className="text-accent">{user?.firstName || user?.username || "Atleta"}</span> 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              {DAYS_FULL[todayIndex]}, {new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long" })}
            </p>
            <p className="text-muted-foreground mt-1">
        Bienvenido nuevamente
    </p>
          </div>
          {!hasPlan && (
            <Button onClick={() => setWizardOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
              <Plus className="w-4 h-4" /> Crear mi rutina
            </Button>
          )}
        </div>

        {/* Progress Stats */}
        {progressLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl bg-muted/30" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Zap} label="XP Total" value={progress?.totalXP?.toLocaleString() || "0"} sub="puntos de experiencia" color="text-accent" bg="bg-accent/10" />
            <StatCard icon={Trophy} label="Nivel" value={`${progress?.level || 1}`} sub={`${progress?.totalXP || 0} / ${xpToNextLevel} XP`} color="text-yellow-400" bg="bg-yellow-400/10" />
            <StatCard icon={Flame} label="Racha" value={`${progress?.streak || 0}`} sub="días consecutivos" color="text-orange-400" bg="bg-orange-400/10" />
            <StatCard icon={TrendingUp} label="Series" value={`${progress?.seriesCompletedHistorically || 0}`} sub="completadas en total" color="text-blue-400" bg="bg-blue-400/10" />
          </div>
        )}

        {/* XP Progress Bar */}
        {progress && (
          <Card className="p-4 border-border/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-semibold text-foreground">Nivel {progress.level}</span>
              </div>
              <span className="text-xs text-muted-foreground">{progress.totalXP % 500} / 500 XP</span>
            </div>
            <Progress value={xpProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {500 - (progress.totalXP % 500)} XP para el nivel {progress.level + 1}
            </p>
          </Card>
        )}

        {/* Weekly Calendar */}
        {hasPlan && generatedPlan && (
          <Card className="p-5 border-border/50">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" /> Semana de Entrenamiento
            </h3>
            <WeeklyCalendar plan={generatedPlan} todayIndex={todayIndex} />
          </Card>
        )}

        {/* No plan state */}
        {!planLoading && !hasPlan && (
          <Card className="p-8 border-border/50 border-dashed text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="w-8 h-8 text-accent" />
            </div>
            <h3 className="font-display text-2xl font-bold text-foreground mb-2">No tenés una rutina activa</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
              Creá tu plan personalizado con IA o generá una rutina de demo para comenzar.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button onClick={() => setWizardOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                <Zap className="w-4 h-4" /> Crear mi rutina personalizada
              </Button>
              <Button variant="outline" onClick={handleGenerateDemo} disabled={generateDemo.isPending} className="border-border/50 gap-2">
                {generateDemo.isPending ? "Generando..." : "Ver rutina de demo"}
              </Button>
            </div>
          </Card>
        )}

        {/* Today's Checklist */}
        {checklist && (checklist as any).id && (
          <Card className="p-5 border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" /> Entrenamiento de Hoy
              </h3>
              <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                {(checklist as any).completedSeries}/{(checklist as any).totalSeries} series
              </Badge>
            </div>
            <Progress value={((checklist as any).completedSeries / (checklist as any).totalSeries) * 100} className="h-2 mb-3" />
            <p className="text-xs text-muted-foreground">
              {(checklist as any).isCompleted ? "✅ ¡Entrenamiento completado! +XP" : `${(checklist as any).totalSeries - (checklist as any).completedSeries} series restantes`}
            </p>
          </Card>
        )}

        {/* Go to training */}
        {hasPlan && (
          <Button onClick={() => navigate("/entrenamiento")} className="w-full bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 gap-2" variant="outline">
            <Dumbbell className="w-4 h-4" /> Ver plan de entrenamiento completo
            <ChevronRight className="w-4 h-4 ml-auto" />
          </Button>
        )}
      </div>

      <TrainingPlanSelector isOpen={wizardOpen} onClose={() => setWizardOpen(false)} onPlanCreated={handlePlanCreated} />
    </DashboardLayout>
  );
}

function StatCard({ icon: Icon, label, value, sub, color, bg }: {
  icon: any; label: string; value: string; sub: string; color: string; bg: string;
}) {
  return (
    <Card className="p-4 border-border/50">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold font-display mt-1 ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
    </Card>
  );
}

function WeeklyCalendar({ plan, todayIndex }: { plan: any; todayIndex: number }) {
  const daysPerWeek = plan.daysPerWeek || 3;
  // Map training days starting from Monday
  const trainingDayIndices: number[] = [];
  for (let i = 0; i < daysPerWeek; i++) {
    trainingDayIndices.push((1 + i) % 7); // Mon, Tue, Wed...
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {DAYS_ES.map((day, idx) => {
        const isTraining = trainingDayIndices.includes(idx);
        const isToday = idx === todayIndex;
        return (
          <div key={idx} className={`rounded-xl p-2 text-center transition-all ${
            isToday ? "border-2 border-accent bg-accent/10" :
            isTraining ? "border border-accent/30 bg-accent/5" :
            "border border-border/20 bg-muted/10"
          }`}>
            <p className={`text-xs font-semibold ${isToday ? "text-accent" : "text-muted-foreground"}`}>{day}</p>
            <div className={`w-6 h-6 rounded-full mx-auto mt-1 flex items-center justify-center ${
              isTraining ? "bg-accent/20" : "bg-transparent"
            }`}>
              {isTraining ? (
                <Dumbbell className={`w-3 h-3 ${isToday ? "text-accent" : "text-accent/60"}`} />
              ) : (
                <Circle className="w-3 h-3 text-border/40" />
              )}
            </div>
            {isToday && <div className="w-1.5 h-1.5 rounded-full bg-accent mx-auto mt-1" />}
          </div>
        );
      })}
    </div>
  );
}
