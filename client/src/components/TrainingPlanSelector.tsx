import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ChevronRight, ChevronLeft, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import type { TrainingWizardData, TrainingObjective, ExperienceLevel, EquipmentType } from "@/types";

interface TrainingPlanSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanCreated: () => void;
}

const OBJECTIVES = [
  { value: "hypertrophy", label: "Ganar Músculo", icon: "💪", desc: "Hipertrofia y volumen" },
  { value: "strength", label: "Ganar Fuerza", icon: "🏋️", desc: "Fuerza máxima" },
  { value: "fat_loss", label: "Perder Grasa", icon: "🔥", desc: "Déficit calórico" },
  { value: "recomposition", label: "Recomposición", icon: "⚖️", desc: "Músculo y definición" },
];

const LEVELS = [
  { value: "beginner", label: "Principiante", desc: "Menos de 1 año" },
  { value: "intermediate", label: "Intermedio", desc: "1-3 años" },
  { value: "advanced", label: "Avanzado", desc: "Más de 3 años" },
];

export function TrainingPlanSelector({ isOpen, onClose, onPlanCreated }: TrainingPlanSelectorProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<TrainingWizardData>>({
    objective: "hypertrophy",
    experienceLevel: "intermediate",
    age: 25,
    weight: 75,
    height: 175,
    daysPerWeek: 3,
    equipment: "full_gym",
    injuries: "",
    preferences: "",
  });

  const createPlan = trpc.training.createPlan.useMutation();

  const validate = (s: number) => {
    if (s === 1 && (!data.objective || !data.experienceLevel)) { toast.error("Seleccioná objetivo y nivel"); return false; }
    if (s === 2 && (!data.age || !data.weight || !data.height)) { toast.error("Completá edad, peso y altura"); return false; }
    if (s === 3 && (!data.daysPerWeek || !data.equipment)) { toast.error("Seleccioná días y equipo"); return false; }
    return true;
  };
const handleCreate = async () => {
  // Diagnóstico de datos
  console.log("Datos que se están enviando:", data);
  
  try {
    // Forzamos la ejecución
    const response = await createPlan.mutateAsync({
      objective: data.objective as TrainingObjective,
      experienceLevel: data.experienceLevel as ExperienceLevel,
      age: Number(data.age),
      weight: Number(data.weight),
      height: Number(data.height),
      daysPerWeek: Number(data.daysPerWeek),
      equipment: data.equipment as EquipmentType,
      injuries: data.injuries || "",
      preferences: data.preferences || "",
    });
    
    console.log("Respuesta del servidor:", response);
    toast.success("¡Rutina creada con éxito!");
    onPlanCreated();
    onClose();
  } catch (error) {
    console.error("Error crítico en la mutación:", error);
    toast.error("Error al crear rutina. Revisa la consola (F12).");
  }
};

  const imc = data.weight && data.height ? (data.weight / ((data.height / 100) ** 2)).toFixed(1) : "—";

  const objectiveLabel = OBJECTIVES.find(o => o.value === data.objective)?.label || "";
  const levelLabel = LEVELS.find(l => l.value === data.experienceLevel)?.label || "";
  const equipmentLabel: Record<string, string> = { full_gym: "Gimnasio Completo", dumbbells: "Solo Mancuernas", bodyweight: "Peso Corporal", limited: "Equipo Limitado" };

  return (
    <Dialog open={isOpen} onOpenChange={() => { setStep(1); onClose(); }}>
      <DialogContent className="bg-card border border-border/50 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-bold text-foreground">
            Tu Rutina Personalizada — Paso {step} de 5
          </DialogTitle>
          <div className="flex gap-1 mt-3">
            {[1,2,3,4,5].map(s => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${s <= step ? "bg-accent" : "bg-border/30"}`} />
            ))}
          </div>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* PASO 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-foreground mb-3">¿Cuál es tu objetivo principal?</h3>
                <div className="grid grid-cols-2 gap-3">
                  {OBJECTIVES.map(o => (
                    <Card key={o.value} onClick={() => setData({ ...data, objective: o.value as TrainingObjective })}
                      className={`p-4 border-2 cursor-pointer transition-all text-center hover:border-accent/60 ${data.objective === o.value ? "border-accent bg-accent/10 glow-green-sm" : "border-border/40"}`}>
                      <div className="text-3xl mb-2">{o.icon}</div>
                      <p className="font-semibold text-foreground text-sm">{o.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{o.desc}</p>
                    </Card>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground mb-3">¿Cuál es tu nivel de experiencia?</h3>
                <div className="grid grid-cols-3 gap-3">
                  {LEVELS.map(l => (
                    <Card key={l.value} onClick={() => setData({ ...data, experienceLevel: l.value as ExperienceLevel })}
                      className={`p-4 border-2 cursor-pointer transition-all text-center hover:border-accent/60 ${data.experienceLevel === l.value ? "border-accent bg-accent/10" : "border-border/40"}`}>
                      <p className="font-semibold text-foreground text-sm">{l.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{l.desc}</p>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PASO 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <h3 className="text-base font-semibold text-foreground">Tu información física</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Edad (años)</label>
                  <Input type="number" min={13} max={100} value={data.age} onChange={e => setData({ ...data, age: parseInt(e.target.value) })} className="mt-1 bg-background border-border/50" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Peso (kg)</label>
                  <Input type="number" min={30} max={300} step={0.5} value={data.weight} onChange={e => setData({ ...data, weight: parseFloat(e.target.value) })} className="mt-1 bg-background border-border/50" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Altura (cm)</label>
                  <Input type="number" min={100} max={250} value={data.height} onChange={e => setData({ ...data, height: parseInt(e.target.value) })} className="mt-1 bg-background border-border/50" />
                </div>
              </div>
              <Card className="p-4 border border-accent/30 bg-accent/5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Índice de Masa Corporal (IMC)</span>
                  <span className="text-2xl font-bold text-accent">{imc}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {parseFloat(imc) < 18.5 ? "Bajo peso" : parseFloat(imc) < 25 ? "Peso normal ✓" : parseFloat(imc) < 30 ? "Sobrepeso" : "Obesidad"}
                </p>
              </Card>
            </div>
          )}

          {/* PASO 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-foreground mb-4">¿Cuántos días por semana podés entrenar?</h3>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-muted-foreground text-sm">Entre 2 y 6 días</span>
                  <span className="text-4xl font-bold text-accent font-display">{data.daysPerWeek}</span>
                </div>
                <Slider value={[data.daysPerWeek || 3]} onValueChange={v => setData({ ...data, daysPerWeek: v[0] })} min={2} max={6} step={1} className="w-full" />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  {[2,3,4,5,6].map(n => <span key={n}>{n}</span>)}
                </div>
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground mb-3">¿Qué equipo tenés disponible?</h3>
                <Select value={data.equipment} onValueChange={v => setData({ ...data, equipment: v as EquipmentType })}>
                  <SelectTrigger className="bg-background border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_gym">🏋️ Gimnasio Completo</SelectItem>
                    <SelectItem value="dumbbells">💪 Solo Mancuernas</SelectItem>
                    <SelectItem value="bodyweight">🤸 Peso Corporal</SelectItem>
                    <SelectItem value="limited">🎽 Equipo Limitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* PASO 4 */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-semibold text-foreground mb-2">¿Tenés lesiones o limitaciones?</h3>
                <Textarea placeholder="Ej: Dolor de espalda baja, rodilla izquierda débil... (Opcional)" value={data.injuries} onChange={e => setData({ ...data, injuries: e.target.value })} className="bg-background border-border/50 min-h-24" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground mb-2">Preferencias de ejercicios</h3>
                <Textarea placeholder="Ej: Prefiero ejercicios compuestos, evito máquinas, me gusta el cardio... (Opcional)" value={data.preferences} onChange={e => setData({ ...data, preferences: e.target.value })} className="bg-background border-border/50 min-h-24" />
              </div>
            </div>
          )}

          {/* PASO 5 */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground">Resumen de tu rutina</h3>
              <Card className="p-5 border border-border/50 bg-background/50">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-muted-foreground">Objetivo</p><p className="font-semibold text-foreground mt-1">{objectiveLabel}</p></div>
                  <div><p className="text-muted-foreground">Nivel</p><p className="font-semibold text-foreground mt-1">{levelLabel}</p></div>
                  <div><p className="text-muted-foreground">Datos físicos</p><p className="font-semibold text-foreground mt-1">{data.age}a / {data.weight}kg / {data.height}cm</p></div>
                  <div><p className="text-muted-foreground">Días / semana</p><p className="font-semibold text-accent mt-1 text-lg font-bold">{data.daysPerWeek} días</p></div>
                  <div><p className="text-muted-foreground">Equipo</p><p className="font-semibold text-foreground mt-1">{equipmentLabel[data.equipment || "full_gym"]}</p></div>
                  <div><p className="text-muted-foreground">Lesiones</p><p className="font-semibold text-foreground mt-1 text-xs">{data.injuries || "Ninguna"}</p></div>
                </div>
              </Card>
              <Card className="p-4 border border-accent/30 bg-accent/5">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    La IA generará un plan de entrenamiento y nutrición completamente personalizado basado en tu perfil.
                    Este proceso puede tomar unos segundos.
                  </p>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-2 border-t border-border/30">
          <Button variant="outline" onClick={() => step > 1 ? setStep(step - 1) : onClose()} className="gap-2 border-border/50">
            <ChevronLeft className="w-4 h-4" />
            {step === 1 ? "Cancelar" : "Atrás"}
          </Button>

          {step < 5 ? (
            <Button onClick={() => validate(step) && setStep(step + 1)} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
              Siguiente <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            // --- AQUÍ ES DONDE DEBES PEGAR EL CÓDIGO CON STOPPROPAGATION ---
            <Button 
              onClick={(e) => { // Agregamos 'e' como argumento
                e.stopPropagation(); // Esto detiene la interferencia del Wizard
                console.log("Clic detectado y evento detenido");
                handleCreate();
              }} 
              disabled={createPlan.isPending} 
              className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
            >
              {createPlan.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
              ) : (
                <><Zap className="w-4 h-4" /> Crear mi rutina</>
              )}
            </Button>
            // -----------------------------------------------------------------
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
