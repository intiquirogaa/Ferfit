import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, Zap } from "lucide-react";

interface TrainingDay {
  date: Date;
  dayNumber: number;
  focus: string;
  exercises: Array<{
    name: string;
    sets: number;
    reps: string;
  }>;
  completed: boolean;
  xpEarned: number;
  completedSeries: number;
  totalSeries: number;
}

interface Props {
  trainingDays: TrainingDay[];
  onDayClick?: (day: TrainingDay) => void;
}

export default function TrainingCalendar({ trainingDays, onDayClick }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [daysInMonth, setDaysInMonth] = useState<(TrainingDay | null)[]>([]);

  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInPrevMonth = firstDay.getDay();
    const daysInCurrentMonth = lastDay.getDate();

    const days: (TrainingDay | null)[] = [];

    for (let i = 0; i < daysInPrevMonth; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const date = new Date(year, month, day);
      const trainingDay = trainingDays.find(td => {
        const tdDate = new Date(td.date);
        return tdDate.toDateString() === date.toDateString();
      });
      days.push(trainingDay || null);
    }

    setDaysInMonth(days);
  }, [currentMonth, trainingDays]);

  const monthName = currentMonth.toLocaleString("es-ES", { month: "long", year: "numeric" });
  const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sab"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-2xl font-bold text-foreground capitalize">{monthName}</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            Hoy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
            {day}
          </div>
        ))}

        {daysInMonth.map((day, idx) => (
          <div key={idx} className="aspect-square">
            {day ? (
              <Card
                className={`h-full p-2 cursor-pointer transition-all hover:shadow-lg ${
                  day.completed
                    ? "bg-accent/10 border-accent/50"
                    : "bg-card/50 border-border/30"
                }`}
                onClick={() => onDayClick?.(day)}
              >
                <div className="h-full flex flex-col justify-between text-xs">
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-semibold text-foreground">{day.date.getDate()}</span>
                    {day.completed && (
                      <CheckCircle2 className="w-3 h-3 text-accent shrink-0" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-muted-foreground line-clamp-1 font-medium">{day.focus}</p>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Zap className="w-2.5 h-2.5" />
                      <span>{day.xpEarned} XP</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{day.completedSeries}/{day.totalSeries}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="h-full bg-muted/20 rounded-lg" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
