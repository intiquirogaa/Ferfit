import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import { DayDetailsDrawer } from "./DayDetailsDrawer";

type ViewMode = "day" | "month" | "year";

interface TrainingDay {
  date: Date;
  dayOfWeek: string;
  exerciseCount: number;
  isCompleted: boolean;
  completedExercises?: number;
}

interface CalendarMultiViewEnhancedProps {
  completedDates: Date[];
  trainingDays: TrainingDay[];
  completionRate: number; // Porcentaje histórico de ejercicios completados
}

export function CalendarMultiViewEnhanced({
  completedDates,
  trainingDays,
  completionRate,
}: CalendarMultiViewEnhancedProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsDrawerOpen(true);
  };

  const isDateCompleted = (date: Date) => {
    return completedDates.some(
      (d) =>
        d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate()
    );
  };

  const getTrainingDay = (date: Date) => {
    return trainingDays.find(
      (td) =>
        td.date.getFullYear() === date.getFullYear() &&
        td.date.getMonth() === date.getMonth() &&
        td.date.getDate() === date.getDate()
    );
  };

  const getProjectedCompletion = (trainingDay: TrainingDay) => {
    if (trainingDay.isCompleted && trainingDay.completedExercises) {
      return trainingDay.completedExercises;
    }
    // Proyectar basado en porcentaje histórico
    return Math.round((trainingDay.exerciseCount * completionRate) / 100);
  };

  const getDayView = () => {
    const day = currentDate.getDate();
    const month = currentDate.toLocaleString("es-AR", { month: "long" });
    const year = currentDate.getFullYear();
    const isCompleted = isDateCompleted(currentDate);
    const trainingDay = getTrainingDay(currentDate);

    return (
      <div className="text-center space-y-4">
        <div className="text-6xl font-bold text-accent">{day}</div>
        <div className="text-lg text-muted-foreground">
          {month.charAt(0).toUpperCase() + month.slice(1)} {year}
        </div>
        
        {trainingDay ? (
          <div className="space-y-3">
            <Button
              onClick={() => handleDateClick(currentDate)}
              variant="outline"
              className={`w-full p-4 rounded-xl border-2 ${
                isCompleted
                  ? "border-accent/50 bg-accent/10 hover:bg-accent/20"
                  : "border-border/30 bg-muted/10 hover:bg-muted/20"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={isCompleted ? "text-accent font-semibold" : "text-muted-foreground"}>
                  {isCompleted ? "✓ Completado" : "Planificado"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {isCompleted && trainingDay.completedExercises
                    ? `${trainingDay.completedExercises}/${trainingDay.exerciseCount} ejercicios`
                    : `${trainingDay.exerciseCount} ejercicios`}
                </span>
              </div>
            </Button>

            {!isCompleted && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <p className="text-xs text-blue-400 font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Proyección
                </p>
                <p className="text-sm text-blue-300 mt-1">
                  ~{getProjectedCompletion(trainingDay)} de {trainingDay.exerciseCount} ejercicios ({completionRate}%)
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
            <p className="text-muted-foreground">Sin entrenamiento planificado</p>
          </div>
        )}
      </div>
    );
  };

  const getMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

    return (
      <div className="space-y-4">
        <div className="text-lg font-semibold text-foreground text-center">
          {currentDate.toLocaleString("es-AR", { month: "long", year: "numeric" })}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
              {day}
            </div>
          ))}
          {days.map((date, idx) => {
            const isCompleted = date && isDateCompleted(date);
            const trainingDay = date && getTrainingDay(date);
            const hasTraining = date && trainingDay;

            return (
              <div
                key={idx}
                onClick={() => date && handleDateClick(date)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-semibold cursor-pointer transition-all relative ${
                  date
                    ? hasTraining
                      ? isCompleted
                        ? "bg-green-500/20 border-2 border-green-500/50 text-green-400"
                        : "bg-blue-500/20 border-2 border-blue-500/50 text-blue-400"
                      : "bg-muted/30 border border-border/30 text-muted-foreground hover:border-accent/40"
                    : "bg-transparent"
                }`}
              >
                {date?.getDate()}
                {hasTraining && (
                  <div className="absolute bottom-1 text-xs">
                    {isCompleted ? (
                      <CheckCircle2 className="w-3 h-3 text-green-400" />
                    ) : (
                      <Clock className="w-3 h-3 text-blue-400" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className="flex gap-4 text-xs text-muted-foreground pt-2 border-t border-border/30">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500/30 border border-green-500/50" />
            <span>Completado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500/30 border border-blue-500/50" />
            <span>Planificado</span>
          </div>
        </div>
      </div>
    );
  };

  const getYearView = () => {
    const year = currentDate.getFullYear();
    const months = [
      "Ene", "Feb", "Mar", "Abr", "May", "Jun",
      "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
    ];

    const getCompletedInMonth = (monthIdx: number) => {
      return completedDates.filter(
        (d) => d.getFullYear() === year && d.getMonth() === monthIdx
      ).length;
    };

    const getTrainingDaysInMonth = (monthIdx: number) => {
      return trainingDays.filter(
        (td) => td.date.getFullYear() === year && td.date.getMonth() === monthIdx
      ).length;
    };

    return (
      <div className="space-y-4">
        <div className="text-lg font-semibold text-foreground text-center">{year}</div>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          {months.map((month, idx) => {
            const completed = getCompletedInMonth(idx);
            const trainingDaysCount = getTrainingDaysInMonth(idx);
            const percentage = trainingDaysCount > 0 ? (completed / trainingDaysCount) * 100 : 0;

            return (
              <div
                key={month}
                className="p-3 rounded-lg border border-border/30 bg-muted/10 hover:border-accent/40 transition-all cursor-pointer"
                onClick={() => {
                  setCurrentDate(new Date(year, idx, 1));
                  setViewMode("month");
                }}
              >
                <p className="text-xs font-semibold text-muted-foreground mb-2">{month}</p>
                <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent/60 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {completed}/{trainingDaysCount}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6 bg-background/60 border-border/40">
      {/* View Mode Selector */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <Button
            variant={viewMode === "day" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("day")}
            className="text-xs"
          >
            Día
          </Button>
          <Button
            variant={viewMode === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("month")}
            className="text-xs"
          >
            Mes
          </Button>
          <Button
            variant={viewMode === "year" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("year")}
            className="text-xs"
          >
            Año
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newDate = new Date(currentDate);
              if (viewMode === "day") newDate.setDate(newDate.getDate() - 1);
              else if (viewMode === "month") newDate.setMonth(newDate.getMonth() - 1);
              else newDate.setFullYear(newDate.getFullYear() - 1);
              setCurrentDate(newDate);
            }}
            className="w-8 h-8 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
            className="text-xs px-2"
          >
            <Calendar className="w-3 h-3 mr-1" /> Hoy
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newDate = new Date(currentDate);
              if (viewMode === "day") newDate.setDate(newDate.getDate() + 1);
              else if (viewMode === "month") newDate.setMonth(newDate.getMonth() + 1);
              else newDate.setFullYear(newDate.getFullYear() + 1);
              setCurrentDate(newDate);
            }}
            className="w-8 h-8 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* View Content */}
      <div className="min-h-96">
        {viewMode === "day" && getDayView()}
        {viewMode === "month" && getMonthView()}
        {viewMode === "year" && getYearView()}
      </div>

      {/* Drawer */}
      {selectedDate && (
        <DayDetailsDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          date={selectedDate}
        />
      )}
    </Card>
  );
}
