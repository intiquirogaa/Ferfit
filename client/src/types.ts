export interface Exercise {
  name: string;
  muscleGroup?: string;
  muscleGroups?: string[];
  sets: number | string;
  reps: string;
  restSeconds?: number;
  notes?: string;
  technique?: string;
  alternatives?: string[];
  seriesCompleted?: Record<number, boolean>;
  instructions?: string;
  tips?: string;
  duration?: number;
  intensity?: "low" | "medium" | "high";
}

export interface TrainingDay {
  dayNumber: number;
  focus: string;
  warmup: string;
  exercises: Exercise[];
  cooldown: string;
  notes?: string;
}

export interface Meal {
  mealNumber: number;
  time: string;
  name: string;
  foods: string[];
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
  calories: number;
  notes?: string;
}

export interface TrainingPlan {
  id: number;
  userId: number;
  type: "strength" | "hypertrophy";
  daysPerWeek: number;
  durationWeeks: number;
  startDate: Date;
  isActive: number;
  generatedContent: {
    summary: string;
    objective: string;
    durationWeeks: number;
    daysPerWeek: number;
    progressionStrategy: string;
    days: TrainingDay[];
    nutrition: {
      dailyCalories: number;
      dailyMacros: {
        protein: number;
        carbs: number;
        fats: number;
      };
      mealFrequency: number;
      meals: Meal[];
      tips: string[];
      hydration: string;
      supplementation: string;
      notes: string;
    };
    generalAdvice: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProgress {
  id: number;
  userId: number;
  totalXP: number;
  level: number;
  streak: number;
  seriesCompletedHistorically: number;
  seriesProgrammed: number;
  lastWorkoutDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyChecklist {
  id: number;
  userId: number;
  trainingPlanId: number;
  date: Date;
  dayOfWeek: string;
  totalSeries: number;
  completedSeries: number;
  isCompleted: number;
  xpEarned: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeneratedTrainingAndNutritionPlan {
  summary: string;
  objective: string;
  durationWeeks: number;
  daysPerWeek: number;
  progressionStrategy: string;
  days: TrainingDay[];
  nutrition: NutritionPlan;
  generalAdvice: string;
}

export interface NutritionPlan {
  dailyCalories: number;
  dailyMacros: {
    protein: number;
    carbs: number;
    fats: number;
  };
  mealFrequency: number;
  meals: Meal[];
  tips: string[];
  hydration: string;
  supplementation: string;
  notes: string;
}

export interface MealPlan {
  mealNumber: number;
  time: string;
  name: string;
  foods: string[];
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
  calories: number;
  notes?: string;
}

export type TrainingObjective = "hypertrophy" | "strength" | "fat_loss" | "recomposition";
export type ExperienceLevel = "beginner" | "intermediate" | "advanced";
export type EquipmentType = "full_gym" | "dumbbells" | "bodyweight" | "limited";

export interface TrainingWizardData {
  objective: TrainingObjective;
  experienceLevel: ExperienceLevel;
  age: number;
  weight: number;
  height: number;
  daysPerWeek: number;
  equipment: EquipmentType;
  injuries?: string;
  preferences?: string;
}
