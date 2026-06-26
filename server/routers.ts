import { COOKIE_NAME } from "@shared/const";
import { getDb } from "./db";
import { eq } from "drizzle-orm"; 
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { callDataApi } from "./_core/dataApi";
import { z } from "zod";
import * as db from "./db";
import { trainingPlans } from "../drizzle/schema";

// Helper para actualizar plan de entrenamiento
async function updateTrainingPlanContent(planId: number, generatedContent: string) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  await database.update(trainingPlans)
    .set({ generatedContent })
    .where(eq(trainingPlans.id, planId));
}


export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  training: router({
    createPlan: protectedProcedure
      .input(z.object({
        objective: z.enum(["hypertrophy", "strength", "fat_loss", "recomposition"]),
        experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
        age: z.number().min(13).max(100),
        weight: z.number().min(30).max(300),
        height: z.number().min(100).max(250),
        daysPerWeek: z.number().min(2).max(6),
        equipment: z.enum(["full_gym", "dumbbells", "bodyweight", "limited"]),
        injuries: z.string().optional(),
        preferences: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Not authenticated");
        try {
          console.log("[createPlan] Generating plan for user:", ctx.user.id);
          const generatedPlan = await generatePersonalizedPlanWithNutrition(input);
          const generatedContentJson = JSON.stringify(generatedPlan);
          const result = await db.createTrainingPlan(
            ctx.user.id,
            input.objective === "strength" ? "strength" : "hypertrophy",
            input.daysPerWeek,
            generatedContentJson
          );
          console.log("[createPlan] Plan saved:", result);
          return {
            id: (result as any).insertId || 0,
            userId: ctx.user.id,
            type: input.objective === "strength" ? "strength" : "hypertrophy",
            daysPerWeek: input.daysPerWeek,
            durationWeeks: 12,
            generatedContent: generatedContentJson,
            isActive: 1,
            startDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        } catch (error) {
          console.error("[createPlan] Error:", error);
          throw error;
        }
      }),

    getActivePlan: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");
      try {
        const plan = await db.getActiveTrainingPlan(ctx.user.id);
        if (!plan) return { hasPlan: false, id: null, userId: ctx.user.id };
        let generatedContent = plan.generatedContent;
        if (typeof generatedContent === "string") {
          try { generatedContent = JSON.parse(generatedContent); } catch { /* keep as string */ }
        }
        return { ...plan, hasPlan: true, generatedContent };
      } catch (error) {
        console.error("[getActivePlan] Error:", error);
        return { hasPlan: false, id: null, userId: ctx.user.id };
      }
    }),

    getTodayChecklist: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");
      try {
        const checklist = await db.getTodayChecklist(ctx.user.id);
        return checklist || { hasTrainingToday: false, exercises: [], id: null, userId: ctx.user.id };
      } catch (error) {
        console.error("[getTodayChecklist] Error:", error);
        return { hasTrainingToday: false, exercises: [], id: null, userId: ctx.user.id };
      }
    }),

    updateProgress: protectedProcedure
      .input(z.object({
        checklistId: z.number(),
        completedSeries: z.number(),
        xpEarned: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Not authenticated");
        await db.updateChecklistProgress(input.checklistId, input.completedSeries, input.xpEarned);
        await db.updateUserProgress(ctx.user.id, input.xpEarned, input.completedSeries);
        return { success: true };
      }),

    getUserProgress: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");
      let progress = await db.getUserProgress(ctx.user.id);
      if (!progress) {
        await db.createUserProgress(ctx.user.id);
        progress = await db.getUserProgress(ctx.user.id);
      }
      return progress;
    }),

    createDailyChecklist: protectedProcedure
      .input(z.object({
        trainingPlanId: z.number(),
        dayOfWeek: z.string(),
        totalSeries: z.number().min(1).max(100),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Not authenticated");
        return await db.createDailyChecklist(ctx.user.id, input.trainingPlanId, input.dayOfWeek, input.totalSeries);
      }),

    generateDemoRoutine: protectedProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");
      try {
        const generatedContent = await generatePersonalizedPlanWithNutrition({
          objective: "hypertrophy",
          experienceLevel: "intermediate",
          age: 28,
          weight: 75,
          height: 180,
          daysPerWeek: 4,
          equipment: "full_gym",
          injuries: "",
          preferences: "Upper/Lower split",
        });
        const planId = await db.createTrainingPlan(ctx.user.id, "hypertrophy", 4, JSON.stringify(generatedContent));
        return { id: planId, userId: ctx.user.id, type: "hypertrophy", daysPerWeek: 4, generatedContent, isActive: 1 };
      } catch (error) {
        console.error("[generateDemoRoutine] Error:", error);
        throw new Error("No se pudo generar la rutina de demo");
      }
    }),

    searchExercise: protectedProcedure
      .input(z.object({ name: z.string() }))
      .query(async ({ input }) => {
        try {
          console.log("[searchExercise] Searching for:", input.name);
          const result = await callDataApi("ExerciseDB/exercises/name/{name}", {
            pathParams: { name: encodeURIComponent(input.name.toLowerCase()) },
            query: { limit: 3, offset: 0 },
          }) as any[];
          if (Array.isArray(result) && result.length > 0) {
            const ex = result[0];
            return {
              found: true,
              gifUrl: ex.gifUrl || null,
              instructions: Array.isArray(ex.instructions) ? ex.instructions : [],
              targetMuscles: ex.target || ex.targetMuscles || "",
              secondaryMuscles: Array.isArray(ex.secondaryMuscles) ? ex.secondaryMuscles : [],
              equipment: ex.equipment || "",
              bodyPart: ex.bodyPart || "",
            };
          }
          return { found: false, gifUrl: null, instructions: [], targetMuscles: "", secondaryMuscles: [], equipment: "", bodyPart: "" };
        } catch (error) {
          console.error("[searchExercise] Error:", error);
          return { found: false, gifUrl: null, instructions: [], targetMuscles: "", secondaryMuscles: [], equipment: "", bodyPart: "" };
        }
      }),
    markSeriesComplete: protectedProcedure
      .input(z.object({
        trainingPlanId: z.number(),
        dayNumber: z.number(),
        exerciseIndex: z.number(),
        seriesIndex: z.number(),
        completed: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Not authenticated");
        try {
          // Obtener el plan actual
          const plan = await db.getActiveTrainingPlan(ctx.user.id);
          if (!plan) throw new Error("No active training plan");
          
          const generatedContent = JSON.parse(plan.generatedContent || "{}");
          const day = generatedContent.days?.[input.dayNumber - 1];
          if (!day) throw new Error("Day not found");
          
          const exercise = day.exercises?.[input.exerciseIndex];
          if (!exercise) throw new Error("Exercise not found");
          
          // Inicializar tracking si no existe
          if (!exercise.seriesCompleted) exercise.seriesCompleted = {};
          exercise.seriesCompleted[input.seriesIndex] = input.completed;
          
          // Calcular XP: +10 por serie completada, -10 al desmarcar
          let xpGained = 0;
          if (input.completed) {
            xpGained = 10;
            // Bonus si todas las series del ejercicio están completadas
            const totalSeries = exercise.sets || 3;
            const completedSeries = Object.values(exercise.seriesCompleted as Record<string, boolean>).filter(Boolean).length;
            if (completedSeries === totalSeries) xpGained += 25;
          } else {
            // Al desmarcar, restar XP (pero no permitir negativos)
            xpGained = -10;
          }
          
          // Actualizar progreso del usuario
          const progress = await db.getUserProgress(ctx.user.id);
          if (progress) {
            const newXp = (progress.totalXP || 0) + xpGained;
            await db.updateUserProgress(ctx.user.id, xpGained, 1);
          }
          
          // Guardar cambios en el plan
          const updatedPlan = JSON.stringify(generatedContent);
          await updateTrainingPlanContent(plan.id, updatedPlan);
          
          return { success: true, xpGained, newXp: (progress?.totalXP || 0) + xpGained };
        } catch (error) {
          console.error("[markSeriesComplete] Error:", error);
          throw error;
        }
      }),
    searchExerciseWithMedia: publicProcedure
      .input(z.object({
        name: z.string(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        try {
          const { getExerciseMediaUrl } = await import("./_core/musclewiki");
          const media = await getExerciseMediaUrl(input.name);
          return {
            success: true,
            media,
            exerciseName: input.name,
          };
        } catch (error) {
          console.error("[searchExerciseWithMedia] Error:", error);
          return {
            success: false,
            media: null,
            error: "Failed to search exercise media",
          };
        }
      }),

    getDailyProgress: protectedProcedure
      .input(z.object({
        trainingPlanId: z.number(),
        dayNumber: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Not authenticated");
        try {
          const plan = await db.getActiveTrainingPlan(ctx.user.id);
          if (!plan) return { exercises: [] };
          
          const generatedContent = JSON.parse(plan.generatedContent || "{}");
          const day = generatedContent.days?.[input.dayNumber - 1];
          if (!day) return { exercises: [] };
          
          return {
            dayNumber: input.dayNumber,
            focus: day.focus,
            exercises: (day.exercises || []).map((ex: any, idx: number) => ({
              index: idx,
              name: ex.name,
              sets: ex.sets || 3,
              reps: ex.reps,
              seriesCompleted: ex.seriesCompleted || {},
            })),
          };
        } catch (error) {
          console.error("[getDailyProgress] Error:", error);
          return { exercises: [] };
        }
      }),
      getCompletedDates: protectedProcedure.query(async ({ ctx }) => {
        if (!ctx.user) throw new Error("Not authenticated");
        try {
          const completedDates = await db.getCompletedDates(ctx.user.id);
          return { dates: completedDates };
        } catch (error) {
          console.error("[getCompletedDates] Error:", error);
          return { dates: [] };
        }
      }),
      getDayDetails: protectedProcedure
        .input(z.object({ date: z.date() }))
        .query(async ({ ctx, input }) => {
          if (!ctx.user) throw new Error("Not authenticated");
          try {
            const dayDetails = await db.getDayDetails(ctx.user.id, input.date);
            if (!dayDetails) return { checklist: null, exercises: [], duration: 0 };
            const plan = JSON.parse(dayDetails.plan.generatedContent || "{}");
            const dayOfWeek = input.date.toLocaleDateString('es-ES', { weekday: 'long' });
            const dayIndex = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].indexOf(dayOfWeek.toLowerCase());
            const dayPlan = plan.plan?.days?.[dayIndex] || { exercises: [] };
            return { checklist: dayDetails.checklist, exercises: dayPlan.exercises || [], duration: dayPlan.duration || 0 };
          } catch (error) {
            console.error("[getDayDetails] Error:", error);
            return { checklist: null, exercises: [], duration: 0 };
          }
        }),
  }),
});

export type AppRouter = typeof appRouter;

/* ─── HELPERS ────────────────────────────────────────────── */

function calculateTDEE(age: number, weight: number, height: number, daysPerWeek: number): number {
  const bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  const activityMultipliers: Record<number, number> = { 2: 1.375, 3: 1.375, 4: 1.55, 5: 1.725, 6: 1.725 };
  return Math.round(bmr * (activityMultipliers[daysPerWeek] || 1.55));
}

function calculateMacros(objective: string, weight: number, tdee: number) {
  let calories = tdee;
  if (objective === "hypertrophy") calories = tdee + 300;
  else if (objective === "fat_loss") calories = tdee - 400;
  else if (objective === "recomposition") calories = tdee;
  const protein = Math.round(weight * 2.2);
  const fats = Math.round((calories * 0.25) / 9);
  const carbs = Math.round((calories - protein * 4 - fats * 9) / 4);
  return { protein, carbs, fats };
}

const EQUIPMENT_MAP: Record<string, string> = {
  full_gym: "gimnasio completo con máquinas, barras, mancuernas y poleas",
  dumbbells: "solo mancuernas (sin máquinas ni barras)",
  bodyweight: "solo peso corporal, sin equipamiento",
  limited: "equipo limitado (bandas elásticas, mancuernas ligeras)",
};

const OBJECTIVE_MAP: Record<string, string> = {
  hypertrophy: "hipertrofia muscular (ganar músculo)",
  strength: "fuerza máxima (sentadilla, press, peso muerto)",
  fat_loss: "pérdida de grasa (déficit calórico, cardio incluido)",
  recomposition: "recomposición corporal (ganar músculo y perder grasa simultáneamente)",
};

const LEVEL_MAP: Record<string, string> = {
  beginner: "principiante (menos de 1 año entrenando, ejercicios básicos, bajo volumen)",
  intermediate: "intermedio (1-3 años, puede usar técnicas avanzadas moderadas)",
  advanced: "avanzado (más de 3 años, puede usar periodización compleja)",
};

async function generatePersonalizedPlanWithNutrition(input: {
  objective: string;
  experienceLevel: string;
  age: number;
  weight: number;
  height: number;
  daysPerWeek: number;
  equipment: string;
  injuries?: string;
  preferences?: string;
}) {
  try {
    const imc = (input.weight / ((input.height / 100) ** 2)).toFixed(1);
    const tdee = calculateTDEE(input.age, input.weight, input.height, input.daysPerWeek);
    const macros = calculateMacros(input.objective, input.weight, tdee);
    const equipmentDesc = EQUIPMENT_MAP[input.equipment] || input.equipment;
    const objectiveDesc = OBJECTIVE_MAP[input.objective] || input.objective;
    const levelDesc = LEVEL_MAP[input.experienceLevel] || input.experienceLevel;

    const prompt = `Eres un Personal Trainer y Nutricionista experto. Genera un plan de entrenamiento y nutrición COMPLETAMENTE PERSONALIZADO en JSON.

PERFIL DEL CLIENTE:
- Objetivo: ${objectiveDesc}
- Nivel: ${levelDesc}
- Edad: ${input.age} años | Peso: ${input.weight}kg | Altura: ${input.height}cm | IMC: ${imc}
- Días de entrenamiento: ${input.daysPerWeek} días/semana
- Equipo disponible: ${equipmentDesc}
- Lesiones/limitaciones: ${input.injuries || "Ninguna"}
- Preferencias: ${input.preferences || "Sin preferencias específicas"}
- TDEE calculado: ${tdee} kcal/día

REGLAS CRÍTICAS:
1. Los ejercicios DEBEN ser compatibles con el equipo disponible (${equipmentDesc})
2. El volumen y complejidad DEBE corresponder al nivel ${input.experienceLevel}
3. Si hay lesiones, EVITAR ejercicios que las agraven
4. El objetivo condiciona la selección de ejercicios, series, reps y descansos
5. Para principiantes: ejercicios compuestos básicos, 3 series, 10-15 reps
6. Para avanzados: técnicas como drop sets, supersets, mayor volumen
7. Usa nombres de ejercicios en INGLÉS (para búsqueda en API de ejercicios)

RESPONDE SOLO CON JSON VÁLIDO (sin markdown):
{
  "summary": "descripción del plan",
  "objective": "${input.objective}",
  "durationWeeks": 12,
  "daysPerWeek": ${input.daysPerWeek},
  "progressionStrategy": "estrategia de progresión específica",
  "days": [
    {
      "dayNumber": 1,
      "focus": "Chest and Triceps",
      "warmup": "descripción del calentamiento",
      "exercises": [
        {
          "name": "Bench Press",
          "muscleGroup": "Chest",
          "sets": 4,
          "reps": "8-10",
          "restSeconds": 90,
          "notes": "instrucción técnica específica",
          "technique": "tip de técnica avanzada",
          "alternatives": ["Dumbbell Press", "Push-up"]
        }
      ],
      "cooldown": "descripción del enfriamiento",
      "notes": "notas del día"
    }
  ],
  "nutrition": {
    "dailyCalories": ${macros.protein * 4 + macros.carbs * 4 + macros.fats * 9},
    "dailyMacros": { "protein": ${macros.protein}, "carbs": ${macros.carbs}, "fats": ${macros.fats} },
    "mealFrequency": 5,
    "meals": [
      { "mealNumber": 1, "time": "08:00", "name": "Desayuno", "foods": ["Huevos", "Avena"], "macros": {"protein": 30, "carbs": 50, "fats": 15}, "calories": 450, "notes": "tip" }
    ],
    "tips": ["tip1", "tip2", "tip3"],
    "hydration": "recomendación de hidratación",
    "supplementation": "suplementos recomendados según objetivo",
    "notes": "notas nutricionales"
  },
  "generalAdvice": "consejos generales personalizados"
}`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "Eres un experto en fitness y nutrición. Responde SOLO con JSON válido. Sin markdown, sin texto adicional." },
        { role: "user", content: prompt },
      ],
    });

    const content = response.choices[0]?.message.content;
    if (!content) return generateBasicPlan(input, tdee, macros);

    let jsonString = typeof content === "string" ? content : JSON.stringify(content);
    if (jsonString.includes("```json")) jsonString = jsonString.split("```json")[1]?.split("```")[0] || jsonString;
    else if (jsonString.includes("```")) jsonString = jsonString.split("```")[1]?.split("```")[0] || jsonString;

    const parsed = JSON.parse(jsonString.trim());
    const validatedPlan = validateGeneratedPlan(parsed, input);
    console.log("[LLM] Plan generated successfully");
    return validatedPlan;
    
  } catch (error) {
    console.error("[LLM] Error:", error instanceof Error ? error.message : String(error));
    const tdee = calculateTDEE(input.age, input.weight, input.height, input.daysPerWeek);
    const macros = calculateMacros(input.objective, input.weight, tdee);
    return generateBasicPlan(input, tdee, macros);
  }
}

async function generateBasicPlan(input: any, tdee: number, macros: any) {
  function validateGeneratedPlan(plan: any, input: any) {
    const injuries = (input.injuries || "").toLowerCase();
  
    if (injuries.includes("rodilla")) {
      const forbidden = [
        "Barbell Squat",
        "Front Squat",
        "Hack Squat",
        "Leg Press",
        "Walking Lunge",
        "Bulgarian Split Squat",
        "Jump Squat"
      ];
  
      const replacements: Record<string, string> = {
        "Barbell Squat": "Hip Thrust",
        "Front Squat": "Glute Bridge",
        "Hack Squat": "Romanian Deadlift",
        "Leg Press": "Hamstring Curl",
        "Walking Lunge": "Hip Thrust",
        "Bulgarian Split Squat": "Glute Bridge",
        "Jump Squat": "Glute Bridge"
      };
  
      for (const day of plan.days || []) {
        day.exercises = (day.exercises || []).map((exercise: any) => {
          if (forbidden.includes(exercise.name)) {
            exercise.name = replacements[exercise.name];
            exercise.notes =
              (exercise.notes || "") +
              " (Ejercicio reemplazado automáticamente por lesión de rodilla)";
          }
  
          return exercise;
        });
      }
    }
  
    return plan;
  }
  const injuries = (input.injuries || "").toLowerCase().trim();

  const hasKneeInjury = injuries.includes("rodilla") || injuries.includes("knee");
  const hasShoulderInjury = injuries.includes("hombro") || injuries.includes("shoulder");
  const hasBackInjury = injuries.includes("espalda") || injuries.includes("back") || injuries.includes("lumbar");

  const isBodyweight = input.equipment === "bodyweight";
  const isBeginnerLevel = input.experienceLevel === "beginner";

  // ================== LEGS - Versión segura ==================
  const legsExercises = hasKneeInjury ? [
    { name: "Hip Thrust", muscleGroup: "Glúteos", sets: 4, reps: "10-12", restSeconds: 75, notes: "Espalda apoyada en banco", technique: "Empuja caderas hacia arriba", alternatives: ["Glute Bridge"] },
    { name: "Romanian Deadlift", muscleGroup: "Isquiotibiales", sets: 3, reps: "10-12", restSeconds: 90, notes: "Espalda recta", technique: "Empuja caderas hacia atrás", alternatives: ["Good Morning"] },
    { name: "Glute Bridge", muscleGroup: "Glúteos", sets: 3, reps: "15-20", restSeconds: 60, notes: "Aprieta glúteos arriba", technique: "Mantén 2 segundos", alternatives: ["Hip Thrust"] },
    { name: "Leg Curl", muscleGroup: "Isquiotibiales", sets: 3, reps: "12-15", restSeconds: 75, notes: "Máquina o acostado", technique: "Controla el movimiento", alternatives: ["Romanian Deadlift"] },
    { name: "Calf Raise", muscleGroup: "Gemelos", sets: 3, reps: "15-20", restSeconds: 45, notes: "De pie o máquina", technique: "Sube sobre los dedos", alternatives: ["Seated Calf Raise"] },
  ] : [
    { name: "Barbell Squat", muscleGroup: "Cuádriceps", sets: 4, reps: "8-10", restSeconds: 120, notes: "Profundidad paralela", technique: "Rodillas hacia afuera", alternatives: ["Goblet Squat"] },
    { name: "Romanian Deadlift", muscleGroup: "Isquiotibiales", sets: 3, reps: "10-12", restSeconds: 90, notes: "Espalda recta", technique: "Empuja caderas hacia atrás", alternatives: ["Leg Curl"] },
    { name: "Hip Thrust", muscleGroup: "Glúteos", sets: 3, reps: "10-12", restSeconds: 75, notes: "Espalda en banco", technique: "Empuja caderas arriba", alternatives: ["Glute Bridge"] },
    { name: "Leg Press", muscleGroup: "Cuádriceps", sets: 3, reps: "12-15", restSeconds: 75, notes: "Pies a ancho de hombros", technique: "No bloquees rodillas", alternatives: ["Hack Squat"] },
  ];

  // ================== SHOULDERS - Versión segura ==================
  const shouldersExercises = hasShoulderInjury ? [
    { name: "Lateral Raise", muscleGroup: "Hombros", sets: 3, reps: "12-15", restSeconds: 60, notes: "Codos ligeramente flexionados", technique: "Eleva hasta altura de hombro", alternatives: ["Cable Lateral Raise"] },
    { name: "Face Pull", muscleGroup: "Deltoides posteriores", sets: 3, reps: "12-15", restSeconds: 60, notes: "Cuerda en polea alta", technique: "Tira hacia la cara", alternatives: ["Reverse Fly"] },
    { name: "Dumbbell Front Raise", muscleGroup: "Deltoides frontales", sets: 3, reps: "12-15", restSeconds: 60, notes: "Movimiento controlado", technique: "Evita impulso", alternatives: ["Plate Front Raise"] },
  ] : [
    { name: "Overhead Press", muscleGroup: "Hombros", sets: 3, reps: "8-10", restSeconds: 90, notes: "Presiona verticalmente", technique: "Core activado", alternatives: ["Dumbbell Press"] },
    { name: "Lateral Raise", muscleGroup: "Hombros laterales", sets: 3, reps: "12-15", restSeconds: 60, notes: "Codos flexionados", technique: "Eleva hasta altura de hombro", alternatives: ["Cable Lateral Raise"] },
    { name: "Face Pull", muscleGroup: "Deltoides posteriores", sets: 3, reps: "12-15", restSeconds: 60, notes: "Cuerda", technique: "Tira hacia la cara", alternatives: ["Reverse Fly"] },
  ];

  const exercisesByFocus: Record<string, any[]> = {
    "Chest and Triceps": [
      { name: "Bench Press", muscleGroup: "Pecho", sets: 4, reps: "8-10", restSeconds: 90, notes: "Barra recta", technique: "Codos a 45°", alternatives: ["Dumbbell Press"] },
      { name: "Incline Dumbbell Press", muscleGroup: "Pecho superior", sets: 3, reps: "10-12", restSeconds: 75, notes: "Banco a 30-45°", technique: "Control total", alternatives: ["Smith Machine Incline"] },
      { name: "Cable Flyes", muscleGroup: "Pecho", sets: 3, reps: "12-15", restSeconds: 60, notes: "Movimiento de abrazo", technique: "Contracción máxima", alternatives: ["Pec Deck"] },
      { name: "Tricep Dips", muscleGroup: "Tríceps", sets: 3, reps: "8-12", restSeconds: 75, notes: "Máquina o peso corporal", technique: "Baja hasta 90°", alternatives: ["Rope Pushdown"] },
      { name: "Rope Pushdown", muscleGroup: "Tríceps", sets: 3, reps: "12-15", restSeconds: 60, notes: "Polea alta", technique: "Extensión completa", alternatives: ["V-bar Pushdown"] },
    ],
    "Back and Biceps": [
      { name: "Barbell Deadlift", muscleGroup: "Espalda baja", sets: 4, reps: "6-8", restSeconds: 120, notes: "Espalda neutral", technique: "Cadera atrás", alternatives: ["Trap Bar Deadlift"] },
      { name: "Bent Over Rows", muscleGroup: "Espalda media", sets: 4, reps: "8-10", restSeconds: 90, notes: "Barra recta", technique: "Codo atrás", alternatives: ["Dumbbell Rows"] },
      { name: "Lat Pulldown", muscleGroup: "Dorsales", sets: 3, reps: "10-12", restSeconds: 75, notes: "Agarre ancho", technique: "Codo abajo", alternatives: ["Pull-ups"] },
      { name: "Barbell Curls", muscleGroup: "Bíceps", sets: 3, reps: "8-10", restSeconds: 75, notes: "Barra recta", technique: "Sin impulso", alternatives: ["Dumbbell Curls"] },
      { name: "Hammer Curls", muscleGroup: "Bíceps", sets: 3, reps: "10-12", restSeconds: 60, notes: "Agarre neutro", technique: "Control total", alternatives: ["Machine Curls"] },
    ],
    "Legs": legsExercises,
    "Shoulders and Abs": [
      ...shouldersExercises,
      { name: "Barbell Rows", muscleGroup: "Espalda", sets: 3, reps: "8-10", restSeconds: 90, notes: "Barra recta", technique: "Codo atrás", alternatives: ["Dumbbell Rows"] },
      { name: "Ab Wheel Rollout", muscleGroup: "Abdominales", sets: 3, reps: "12-15", restSeconds: 60, notes: "Rodillo abdominal", technique: "Control en retorno", alternatives: ["Cable Crunch"] },
      { name: "Hanging Leg Raises", muscleGroup: "Abdominales", sets: 3, reps: "12-15", restSeconds: 60, notes: "Barra de dominadas", technique: "Levanta hasta 90°", alternatives: ["Machine Leg Raise"] },
    ],
    "Full Body": [
      { name: "Barbell Squat", muscleGroup: "Piernas", sets: 3, reps: "8-10", restSeconds: 120, notes: "Profundidad paralela", technique: "Rodillas hacia afuera", alternatives: ["Leg Press"] },
      { name: "Bench Press", muscleGroup: "Pecho", sets: 3, reps: "8-10", restSeconds: 90, notes: "Barra recta", technique: "Codos a 45°", alternatives: ["Dumbbell Press"] },
      { name: "Barbell Rows", muscleGroup: "Espalda", sets: 3, reps: "8-10", restSeconds: 90, notes: "Barra recta", technique: "Codo atrás", alternatives: ["Dumbbell Rows"] },
      { name: "Overhead Press", muscleGroup: "Hombros", sets: 3, reps: "8-10", restSeconds: 90, notes: "De pie", technique: "Core activado", alternatives: ["Dumbbell Press"] },
    ],
  };

  const days = [];
  const focusAreas = ["Chest and Triceps", "Back and Biceps", "Legs", "Shoulders and Abs", "Full Body"];
  
  for (let i = 0; i < input.daysPerWeek; i++) {
    const focusIndex = i % focusAreas.length;
    const focus = focusAreas[focusIndex];
    const exercises = exercisesByFocus[focus] || [];
    
    days.push({
      dayNumber: i + 1,
      focus,
      warmup: "5-10 minutos de cardio ligero + estiramientos dinámicos",
      exercises: exercises.slice(0, 5),
      cooldown: "Estiramientos estáticos 5-10 minutos",
      notes: `Día ${i + 1}: Enfoque en ${focus}`,
    });
  }

  return {
    summary: `Plan personalizado de ${input.daysPerWeek} días/semana para ${input.objective}`,
    objective: input.objective,
    durationWeeks: 12,
    daysPerWeek: input.daysPerWeek,
    progressionStrategy: "Aumenta peso cada semana en 2-5% o agrega 1-2 reps",
    days,
    nutrition: {
      dailyCalories: macros.protein * 4 + macros.carbs * 4 + macros.fats * 9,
      dailyMacros: macros,
      mealFrequency: 5,
      meals: [
        { mealNumber: 1, time: "08:00", name: "Desayuno", foods: ["Huevos", "Avena", "Plátano"], macros: { protein: 30, carbs: 50, fats: 15 }, calories: 450, notes: "Proteína + carbohidratos complejos" },
        { mealNumber: 2, time: "11:00", name: "Snack", foods: ["Almendras", "Manzana"], macros: { protein: 10, carbs: 25, fats: 12 }, calories: 250, notes: "Energía pre-entreno" },
        { mealNumber: 3, time: "14:00", name: "Almuerzo", foods: ["Pollo", "Arroz", "Verduras"], macros: { protein: 40, carbs: 60, fats: 10 }, calories: 500, notes: "Comida principal" },
        { mealNumber: 4, time: "17:00", name: "Pre-entreno", foods: ["Plátano", "Proteína"], macros: { protein: 25, carbs: 40, fats: 5 }, calories: 300, notes: "Antes del entrenamiento" },
        { mealNumber: 5, time: "20:00", name: "Cena", foods: ["Salmón", "Batata", "Brócoli"], macros: { protein: 35, carbs: 45, fats: 12 }, calories: 480, notes: "Proteína + grasas saludables" },
      ],
      tips: [
        "Bebe al menos 3 litros de agua diarios",
        "Come proteína en cada comida",
        "Come carbohidratos complejos antes del entreno",
        "Mantén un déficit calórico moderado para perder grasa",
        "Duerme 7-9 horas cada noche",
      ],
      hydration: "3-4 litros de agua diarios, aumenta si entrenas intenso",
      supplementation: "Proteína en polvo, Creatina, Multivitamínico, Omega-3",
      notes: "Ajusta calorías según progreso cada 2 semanas",
    },
    generalAdvice: "Sigue el plan consistentemente, descansa adecuadamente y ajusta según tu progreso",
  };
}
