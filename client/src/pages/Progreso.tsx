import { trpc } from "@/lib/trpc";
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Flame, Trophy, TrendingUp, Star, Award, Target, Calendar, Dumbbell, TrendingUpIcon } from "lucide-react";
import TrainingCalendar from "@/components/TrainingCalendar";
import ExerciseChecklist from "@/components/ExerciseChecklist";
import ProgressGraphs from "@/components/ProgressGraphs";

const LEVEL_TITLES: Record<number, string> = {
  1: "Novato", 2: "Aprendiz", 3: "Atleta", 4: "Guerrero",
  5: "Campeón", 6: "Élite", 7: "Maestro", 8: "Leyenda",
  9: "Mítico", 10: "Inmortal",
};

export default function Progreso() {
  const { data: progress, isLoading } = trpc.training.getUserProgress.useQuery();
  const { data: completedDatesData } = trpc.training.getCompletedDates.useQuery();
  const { data: trainingPlanData } = trpc.training.getActivePlan.useQuery();
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  const level = progress?.level || 1;
  const xpInLevel = (progress?.totalXP || 0) % 500;
  const xpProgress = (xpInLevel / 500) * 100;
  const levelTitle = LEVEL_TITLES[Math.min(level, 10)] || "Leyenda";

  // Mock training days for calendar (in real app, this would come from backend)
  const trainingDays = [
    {
      date: new Date(2026, 5, 20),
      dayNumber: 1,
      focus: "Pecho y Tríceps",
      exercises: [
        { name: "Press de Banca", sets: 4, reps: "8-10" },
        { name: "Flexiones", sets: 3, reps: "12-15" },
      ],
      completed: true,
      xpEarned: 150,
      completedSeries: 7,
      totalSeries: 7,
    },
    {
      date: new Date(2026, 5, 22),
      dayNumber: 2,
      focus: "Espalda y Bíceps",
      exercises: [
        { name: "Dominadas", sets: 4, reps: "6-8" },
        { name: "Curl de Bíceps", sets: 3, reps: "10-12" },
      ],
      completed: true,
      xpEarned: 140,
      completedSeries: 7,
      totalSeries: 7,
    },
    {
      date: new Date(2026, 5, 24),
      dayNumber: 3,
      focus: "Piernas",
      exercises: [
        { name: "Sentadillas", sets: 4, reps: "8-10" },
        { name: "Prensa de Piernas", sets: 3, reps: "10-12" },
      ],
      completed: false,
      xpEarned: 0,
      completedSeries: 0,
      totalSeries: 7,
    },
  ];

  // Mock exercise progress data
  const exerciseProgressData = {
    "Press de Banca": [
      { date: "Jun 20", weight: 80, reps: 10, sets: 4, duration: 1200, xp: 50 },
      { date: "Jun 22", weight: 82, reps: 9, sets: 4, duration: 1250, xp: 50 },
      { date: "Jun 24", weight: 85, reps: 8, sets: 4, duration: 1300, xp: 50 },
    ],
    "Dominadas": [
      { date: "Jun 20", reps: 8, sets: 4, duration: 900, xp: 40 },
      { date: "Jun 22", reps: 9, sets: 4, duration: 950, xp: 45 },
      { date: "Jun 24", reps: 10, sets: 4, duration: 1000, xp: 50 },
    ],
  };

  // Mock exercises for checklist
  const todayExercises = [
    {
      id: 1,
      name: "Sentadillas",
      plannedSets: 4,
      plannedReps: "8-10",
      completedSets: 3,
      completedReps: "10",
      weight: 100,
      duration: 1200,
      notes: "Última serie con buen control",
      isCompleted: true,
      gifUrl: "https://media.giphy.com/media/l0HlTy9x-Fqw0XO1i/giphy.gif",
    },
    {
      id: 2,
      name: "Prensa de Piernas",
      plannedSets: 3,
      plannedReps: "10-12",
      completedSets: 2,
      completedReps: "12",
      weight: 150,
      duration: 900,
      notes: "",
      isCompleted: false,
      gifUrl: "https://media.giphy.com/media/l0HlQXzRG5Lz0XO1i/giphy.gif",
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Progreso</h1>
          <p className="text-muted-foreground mt-1">Tu historial y estadísticas de entrenamiento</p>
        </div>

        {isLoading && (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl bg-muted/30" />)}
          </div>
        )}

        {!isLoading && progress && (
          <>
            {/* Level Card */}
            <Card className="p-6 border-accent/30 bg-gradient-to-br from-accent/10 to-accent/5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nivel actual</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="font-display text-5xl font-bold text-accent">{level}</span>
                    <div>
                      <p className="font-semibold text-foreground text-lg">{levelTitle}</p>
                      <p className="text-xs text-muted-foreground">{progress.totalXP?.toLocaleString()} XP total</p>
                    </div>
                  </div>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-accent" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Nivel {level}</span>
                  <span>{xpInLevel} / 500 XP</span>
                  <span>Nivel {level + 1}</span>
                </div>
                <Progress value={xpProgress} className="h-3" />
                <p className="text-xs text-muted-foreground text-center">
                  {500 - xpInLevel} XP para alcanzar el nivel {level + 1}
                </p>
              </div>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Zap} label="XP Total" value={progress.totalXP?.toLocaleString() || "0"} sub="puntos" color="text-accent" bg="bg-accent/10" />
              <StatCard icon={Flame} label="Racha Actual" value={`${progress.streak}`} sub="días" color="text-orange-400" bg="bg-orange-400/10" />
              <StatCard icon={TrendingUp} label="Series Completadas" value={`${progress.seriesCompletedHistorically}`} sub="históricas" color="text-blue-400" bg="bg-blue-400/10" />
              <StatCard icon={Target} label="Series Programadas" value={`${progress.seriesProgrammed}`} sub="en total" color="text-purple-400" bg="bg-purple-400/10" />
            </div>

            {/* Tabs for Calendar, Checklist, and Progress */}
            <Tabs defaultValue="calendar" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted/30">
                <TabsTrigger value="calendar" className="gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                  <Calendar className="w-4 h-4" /> Calendario
                </TabsTrigger>
                <TabsTrigger value="checklist" className="gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                  <Dumbbell className="w-4 h-4" /> Hoy
                </TabsTrigger>
                <TabsTrigger value="progress" className="gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                  <TrendingUpIcon className="w-4 h-4" /> Gráficos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="calendar" className="mt-5">
                <TrainingCalendar
                  trainingDays={trainingDays}
                  onDayClick={(day) => console.log("Day clicked:", day)}
                />
              </TabsContent>

              <TabsContent value="checklist" className="mt-5">
                <ExerciseChecklist
                  exercises={todayExercises}
                  onExerciseComplete={(id) => console.log("Exercise completed:", id)}
                  onExerciseUpdate={(id, data) => console.log("Exercise updated:", id, data)}
                />
              </TabsContent>

              <TabsContent value="progress" className="mt-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(exerciseProgressData).map(([exerciseName, data]) => (
                    <ProgressGraphs
                      key={exerciseName}
                      exerciseName={exerciseName}
                      data={data as any}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {/* Achievements */}
            <Card className="p-5 border-border/50">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-accent" /> Logros
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { icon: "🔥", title: "Primera Racha", desc: "3 días consecutivos", unlocked: progress.streak >= 3 },
                  { icon: "💪", title: "Guerrero", desc: "50 series completadas", unlocked: (progress.seriesCompletedHistorically || 0) >= 50 },
                  { icon: "⚡", title: "Nivel 5", desc: "Alcanzar nivel 5", unlocked: level >= 5 },
                  { icon: "🏆", title: "Centurión", desc: "100 series completadas", unlocked: (progress.seriesCompletedHistorically || 0) >= 100 },
                  { icon: "🌟", title: "Racha Épica", desc: "7 días consecutivos", unlocked: progress.streak >= 7 },
                  { icon: "👑", title: "Élite", desc: "Alcanzar nivel 6", unlocked: level >= 6 },
                ].map((a, i) => (
                  <div key={i} className={`p-4 rounded-xl border transition-all ${a.unlocked ? "border-accent/40 bg-accent/5" : "border-border/20 bg-muted/10 opacity-50"}`}>
                    <div className="text-2xl mb-2">{a.icon}</div>
                    <p className={`font-semibold text-sm ${a.unlocked ? "text-foreground" : "text-muted-foreground"}`}>{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
                    {a.unlocked && <p className="text-xs text-accent mt-1 font-semibold">✓ Desbloqueado</p>}
                  </div>
                ))}
              </div>
            </Card>

            {/* Last workout */}
            {progress.lastWorkoutDate && (
              <Card className="p-4 border-border/50">
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Último entrenamiento</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(progress.lastWorkoutDate).toLocaleDateString("es-AR", {
                        weekday: "long", year: "numeric", month: "long", day: "numeric"
                      })}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
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
