import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { TrainingPlanSelector } from "@/components/TrainingPlanSelector";
import GeneratedTrainingPlanView from "@/components/GeneratedTrainingPlanView";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Dumbbell, Zap } from "lucide-react";
import type { GeneratedTrainingAndNutritionPlan } from "@/types";

export default function Entrenamiento() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const utils = trpc.useUtils();

  const { data: planData, isLoading } = trpc.training.getActivePlan.useQuery();
  const hasPlan = planData && (planData as any).hasPlan;

  const generatedPlan: GeneratedTrainingAndNutritionPlan | null = hasPlan && (planData as any).generatedContent
    ? (typeof (planData as any).generatedContent === "string"
        ? JSON.parse((planData as any).generatedContent)
        : (planData as any).generatedContent)
    : null;

  const handlePlanCreated = () => {
    utils.training.getActivePlan.invalidate();
    utils.training.getUserProgress.invalidate();
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Entrenamiento</h1>
            <p className="text-muted-foreground mt-1">Tu plan de entrenamiento personalizado</p>
          </div>
          <Button onClick={() => setWizardOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
            <Plus className="w-4 h-4" /> {hasPlan ? "Nuevo plan" : "Crear plan"}
          </Button>
        </div>

        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl bg-muted/30" />)}
          </div>
        )}

        {!isLoading && !hasPlan && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6">
              <Dumbbell className="w-10 h-10 text-accent" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-3">Sin plan activo</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              Creá tu plan de entrenamiento personalizado con IA. Completá el wizard de 5 pasos y tendrás tu rutina lista en segundos.
            </p>
            <Button onClick={() => setWizardOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
              <Zap className="w-4 h-4" /> Crear mi rutina
            </Button>
          </div>
        )}

        {!isLoading && hasPlan && generatedPlan && (
          <GeneratedTrainingPlanView plan={generatedPlan} />
        )}
      </div>

      <TrainingPlanSelector isOpen={wizardOpen} onClose={() => setWizardOpen(false)} onPlanCreated={handlePlanCreated} />
    </DashboardLayout>
  );
}
