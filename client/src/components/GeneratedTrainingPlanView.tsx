import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Dumbbell, Apple, Flame, Zap, AlertCircle, Droplets, Pill, ChevronLeft, ChevronRight, Clock, Zap as ZapIcon, Flame as FlameIcon, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { ExerciseCard } from './ExerciseCard';
import type { GeneratedTrainingAndNutritionPlan, Meal } from "@/types";
import { trpc } from "@/lib/trpc";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Props {
  plan: GeneratedTrainingAndNutritionPlan;
}

export default function GeneratedTrainingPlanView({ plan }: Props) {
  const { data: planData } = trpc.training.getActivePlan.useQuery();
  const trainingPlanId = (planData as any)?.id || 0;
  
  const calculateCurrentDayIndex = () => {
    const data = planData as any; if (!data?.startDate) return 0;
    const startDate = new Date(data.startDate);
    const today = new Date();
    const daysElapsed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const currentIndex = Math.max(0, Math.min(daysElapsed % (plan.daysPerWeek || 3), (plan.days?.length || 1) - 1));
    return currentIndex;
  };
  
  const [currentDayIndex, setCurrentDayIndex] = useState(() => calculateCurrentDayIndex());
  const [exercisesWithMedia, setExercisesWithMedia] = useState<Record<string, any>>({});
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [expandedExercises, setExpandedExercises] = useState<Set<number>>(new Set());
  
  useEffect(() => {
    setCurrentDayIndex(calculateCurrentDayIndex());
  }, [planData, plan.daysPerWeek]);

  useEffect(() => {
    const currentDay = plan.days?.[currentDayIndex];
    if (!currentDay?.exercises) return;

    setLoadingExercises(true);
    const loadExerciseMedia = async () => {
      const media: Record<string, any> = {};
      
      for (const exercise of currentDay.exercises) {
        try {
          const response = await fetch(
            `/api/trpc/training.searchExerciseWithMedia?input=${encodeURIComponent(JSON.stringify({name: exercise.name, limit: 1}))}`
          );
          
          if (response.ok) {
            const data = await response.json();
            const result = data?.result?.data;
            if (result?.success && result.media?.url) {
              media[exercise.name] = {
                gifUrl: result.media.url,
                exerciseName: result.media.exerciseName,
              };
            }
          }
        } catch (error) {
          console.error(`Error loading media for ${exercise.name}:`, error);
        }
      }
      
      setExercisesWithMedia(media);
      setLoadingExercises(false);
    };

    loadExerciseMedia();
  }, [currentDayIndex, plan.days]);
  
  const currentDay = plan.days?.[currentDayIndex];
  const totalDays = plan.days?.length || 0;

  const objectiveLabels: Record<string, string> = {
    hypertrophy: "Ganar Músculo",
    strength: "Ganar Fuerza",
    fat_loss: "Perder Grasa",
    recomposition: "Recomposición",
  };

  const handleDownloadPDF = async () => {
    try {
      const { exportTrainingAndNutritionPlanToPDF } = await import("@/lib/exportPDF");
      await exportTrainingAndNutritionPlanToPDF(plan);
      toast.success("PDF descargado exitosamente");
    } catch {
      toast.error("Error al descargar PDF");
    }
  };

  const toggleExercise = (index: number) => {
    const newExpanded = new Set(expandedExercises);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedExercises(newExpanded);
  };

  console.log(exerciseTranslations);
  console.log(exercise.name);
  console.log(exerciseTranslations[exercise.name]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-3xl font-bold text-foreground">Tu Rutina Personalizada</h2>
          <p className="text-muted-foreground mt-1">{plan.summary}</p>
        </div>
        <Button onClick={handleDownloadPDF} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 shrink-0">
          <Download className="w-4 h-4" /> Descargar PDF
        </Button>
      </div>

      {/* Day Navigation */}
      {currentDay && (
        <div className="space-y-6">
          {/* Day Header */}
          <Card className="p-6 border-accent/30 bg-gradient-to-r from-accent/10 to-accent/5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-2xl font-bold text-accent">
                  Día {currentDayIndex + 1}: {currentDay.focus}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentDay.notes || `Día ${currentDayIndex + 1} enfocado en ${currentDay.focus}`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDayIndex(Math.max(0, currentDayIndex - 1))}
                  disabled={currentDayIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" disabled>
                  {currentDayIndex + 1} / {totalDays}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDayIndex(Math.min(totalDays - 1, currentDayIndex + 1))}
                  disabled={currentDayIndex === totalDays - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Warm-up Section */}
          {currentDay.warmup && (
            <Card className="p-6 border-orange-400/30 bg-orange-400/5">
              <div className="flex items-start gap-3 mb-3">
                <FlameIcon className="w-5 h-5 text-orange-400 shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-orange-400 text-sm uppercase tracking-wide">Calentamiento</h4>
                  <p className="text-sm text-muted-foreground mt-1">{currentDay.warmup}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Exercises Section */}
          <div className="space-y-3">
            <h4 className="font-semibold text-accent text-sm uppercase tracking-wide flex items-center gap-2">
              <Dumbbell className="w-4 h-4" /> Ejercicios
            </h4>

            {loadingExercises && (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-muted/30 rounded-lg animate-pulse" />
                ))}
              </div>
            )}

            {!loadingExercises && currentDay.exercises && currentDay.exercises.map((exercise, idx) => {
              const media = exercisesWithMedia[exercise.name];
              const isExpanded = expandedExercises.has(idx);

              return (
                <Collapsible key={idx} open={isExpanded} onOpenChange={() => toggleExercise(idx)}>
                  <Card className="border-border/50 overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <div className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                        <div className="flex items-start gap-4">
                          {/* Exercise Number */}
                          <div className="w-10 h-10 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
                            <span className="font-bold text-accent text-sm">{idx + 1}</span>
                          </div>

                          {/* Exercise Info */}
                          <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-foreground text-lg">{exercise.name}
                          </h5>
                            
                            <div className="flex flex-wrap gap-3 mt-2 text-sm">
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Dumbbell className="w-4 h-4" />
                                {exercise.sets} × {exercise.reps}
                              </span>
                              {exercise.duration && (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="w-4 h-4" />
                                  {exercise.duration}s
                                </span>
                              )}
                              {exercise.intensity && (
                                <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
                                  {exercise.intensity === "high" ? "🔥 Alta" : exercise.intensity === "medium" ? "⚡ Media" : "💪 Baja"}
                                </Badge>
                              )}
                            </div>

                            {/* Muscle Groups */}
                            {exercise.muscleGroups && exercise.muscleGroups.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {exercise.muscleGroups.map((muscle, i) => (
                                  <Badge key={i} variant="secondary" className="bg-muted/50 text-muted-foreground">
                                    {muscle}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Expand Icon */}
                          <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="border-t border-border/30 p-4 space-y-4">
                        {/* GIF */}
                        {media?.gifUrl && (
                          <div className="mb-4">
                            <img
                              src={media.gifUrl}
                              alt={exercise.name}
                              className="w-full h-48 object-cover rounded-lg bg-muted"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                        )}

                        {/* Instructions */}
                        {exercise.instructions && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Instrucciones</p>
                            <p className="text-sm text-muted-foreground">{exercise.instructions}</p>
                          </div>
                        )}

                        {/* Tips */}
                        {exercise.tips && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Consejos</p>
                            <p className="text-sm text-muted-foreground">{exercise.tips}</p>
                          </div>
                        )}

                        {/* Series Checklist */}
                        <div>
                          <p className="text-xs font-semibold text-accent uppercase tracking-wide mb-3">Marca tus series</p>
                          <div className="space-y-2">
                            {[...Array(typeof exercise.sets === 'string' ? parseInt(exercise.sets) : exercise.sets)].map((_, seriesIdx) => (
                              <div key={seriesIdx} className="flex items-center gap-3 p-3 rounded-lg border border-border/30 hover:bg-muted/30 transition-colors cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="w-5 h-5 rounded border-border/50 cursor-pointer"
                                  defaultChecked={false}
                                />
                                <span className="text-sm text-muted-foreground">
                                  Serie {seriesIdx + 1} de {exercise.sets} - {exercise.reps} reps
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>

          {/* Nutrition Tab */}
          {plan.nutrition && (
            <Tabs defaultValue="nutrition" className="w-full">
              <TabsList className="grid w-full grid-cols-1 bg-muted/30">
                <TabsTrigger value="nutrition" className="gap-2">
                  <Apple className="w-4 h-4" /> Plan Nutricional
                </TabsTrigger>
              </TabsList>

              <TabsContent value="nutrition" className="mt-4 space-y-4">
                {plan.nutrition.meals && plan.nutrition.meals.map((meal: Meal, idx: number) => (
                  <Card key={idx} className="p-4 border-border/50">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-foreground">{meal.name}</h4>
                      <Badge variant="outline" className="bg-muted/50">
                        {meal.calories} kcal
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{meal.foods.join(", ")}</p>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          )}
        </div>
      )}
    </div>
  );
}
