import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { DayDetailsDrawer } from "./DayDetailsDrawer";

type ViewMode = "day" | "month" | "year";

interface CalendarMultiViewProps {
  completedDates: Date[];
  onDateSelect?: (date: Date) => void;
}

export function CalendarMultiView({
  completedDates,
  onDateSelect,
}: CalendarMultiViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsDrawerOpen(true);
    onDateSelect?.(date);
  };

  const isDateCompleted = (date: Date) => {
    return completedDates.some(
      (d) =>
        d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate()
    );
  };

  const getDayView = () => {
    const day = currentDate.getDate();
    const month = currentDate.toLocaleString("es-AR", { month: "long" });
    const year = currentDate.getFullYear();
    const isCompleted = isDateCompleted(currentDate);

    return (
      <div className="text-center space-y-4">
        <div className="text-6xl font-bold text-accent">{day}</div>
        <div className="text-lg text-muted-foreground">
          {month.charAt(0).toUpperCase() + month.slice(1)} {year}
        </div>
        <Button
          onClick={() => handleDateClick(currentDate)}
          variant="outline"
          className={`w-full p-4 rounded-xl border-2 ${
            isCompleted
              ? "border-accent/50 bg-accent/10 hover:bg-accent/20"
              : "border-border/30 bg-muted/10 hover:bg-muted/20"
          }`}
        >
          <p className={isCompleted ? "text-accent font-semibold" : "text-muted-foreground"}>
            {isCompleted ? "✓ Entrenamiento completado" : "Sin entrenamiento"}
          </p>
        </Button>
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
          {days.map((date, idx) => (
            <div
              key={idx}
              onClick={() => date && handleDateClick(date)}
              className={`aspect-square rounded-lg flex items-center justify-center text-sm font-semibold cursor-pointer transition-all ${
                date
                  ? isDateCompleted(date)
                    ? "bg-accent/20 border border-accent/40 text-accent"
                    : "bg-muted/30 border border-border/30 text-muted-foreground hover:border-accent/40"
                  : "bg-transparent"
              }`}
            >
              {date?.getDate()}
            </div>
          ))}
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

    return (
      <div className="space-y-4">
        <div className="text-lg font-semibold text-foreground text-center">{year}</div>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          {months.map((month, idx) => {
            const completed = getCompletedInMonth(idx);
            const daysInMonth = new Date(year, idx + 1, 0).getDate();
            const percentage = (completed / daysInMonth) * 100;

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
                  {completed}/{daysInMonth}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setFullYear(newDate.getFullYear() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setFullYear(newDate.getFullYear() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setViewMode("day");
  };

  return (
    <Card className="rounded-2xl border border-zinc-200 bg-white shadow-sm hover:shadow-md transition-all">
      <div className="space-y-4">
        {/* Header with controls */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent" />
            <h3 className="font-semibold text-foreground">Calendario de Entrenamientos</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="text-xs"
            >
              Hoy
            </Button>
          </div>
        </div>

        {/* View mode selector */}
        <div className="flex gap-2 border-b border-border/30 pb-3">
          {(["day", "month", "year"] as const).map((mode) => (
            <Button
              key={mode}
              variant={viewMode === mode ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode(mode)}
              className="text-xs capitalize"
            >
              {mode === "day" ? "Día" : mode === "month" ? "Mes" : "Año"}
            </Button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevious}
            className="p-2"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            className="p-2"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Calendar content */}
        <div className="mt-6">
          {viewMode === "day" && getDayView()}
          {viewMode === "month" && getMonthView()}
          {viewMode === "year" && getYearView()}
        </div>
      </div>
      <DayDetailsDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} date={selectedDate} />
    </Card>
  );
}
