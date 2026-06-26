import type { GeneratedTrainingAndNutritionPlan } from "@/types";

export async function exportTrainingAndNutritionPlanToPDF(plan: GeneratedTrainingAndNutritionPlan): Promise<void> {
  const { default: jsPDF } = await import("jspdf");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = margin;

  const checkPage = (needed = 10) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const heading = (text: string, size = 16, color: [number, number, number] = [80, 200, 120]) => {
    checkPage(size + 4);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.setFont("helvetica", "bold");
    doc.text(text, margin, y);
    y += size * 0.5 + 2;
  };

  const body = (text: string, size = 10, color: [number, number, number] = [200, 200, 200]) => {
    checkPage(size + 2);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, contentW);
    doc.text(lines, margin, y);
    y += lines.length * (size * 0.45) + 2;
  };

  const separator = () => {
    checkPage(6);
    doc.setDrawColor(50, 100, 60);
    doc.line(margin, y, pageW - margin, y);
    y += 4;
  };

  // Cover
  doc.setFillColor(15, 20, 25);
  doc.rect(0, 0, pageW, pageH, "F");
  doc.setFontSize(28);
  doc.setTextColor(80, 200, 120);
  doc.setFont("helvetica", "bold");
  doc.text("EviGym Pro", pageW / 2, 50, { align: "center" });
  doc.setFontSize(18);
  doc.setTextColor(220, 220, 220);
  doc.text("Plan Personalizado de Entrenamiento", pageW / 2, 65, { align: "center" });
  doc.text("y Nutrición", pageW / 2, 75, { align: "center" });
  doc.setFontSize(12);
  doc.setTextColor(150, 150, 150);
  doc.text(plan.summary || "", pageW / 2, 95, { align: "center", maxWidth: contentW });
  doc.setFontSize(10);
  doc.text(`Generado el ${new Date().toLocaleDateString("es-AR")}`, pageW / 2, 115, { align: "center" });

  // Summary page
  doc.addPage();
  doc.setFillColor(15, 20, 25);
  doc.rect(0, 0, pageW, pageH, "F");
  y = margin;

  heading("Resumen del Plan", 18);
  separator();
  body(`Objetivo: ${plan.objective}`, 11);
  body(`Duración: ${plan.durationWeeks} semanas`, 11);
  body(`Frecuencia: ${plan.daysPerWeek} días por semana`, 11);
  body(`Calorías diarias: ${plan.nutrition?.dailyCalories || "—"} kcal`, 11);
  y += 4;
  heading("Estrategia de Progresión", 13);
  body(plan.progressionStrategy || "", 10);

  // Training days
  for (const day of plan.days || []) {
    doc.addPage();
    doc.setFillColor(15, 20, 25);
    doc.rect(0, 0, pageW, pageH, "F");
    y = margin;

    heading(`Día ${day.dayNumber}: ${day.focus}`, 16);
    separator();
    if (day.notes) body(day.notes, 10, [150, 150, 150]);
    y += 2;
    heading("Calentamiento", 12, [255, 150, 50]);
    body(day.warmup, 10);
    y += 2;
    heading("Ejercicios", 12);

    for (const ex of day.exercises || []) {
      checkPage(30);
      doc.setFillColor(25, 35, 30);
      doc.roundedRect(margin, y, contentW, 28, 2, 2, "F");
      doc.setFontSize(11);
      doc.setTextColor(80, 200, 120);
      doc.setFont("helvetica", "bold");
      doc.text(ex.name, margin + 3, y + 7);
      doc.setFontSize(9);
      doc.setTextColor(180, 180, 180);
      doc.setFont("helvetica", "normal");
      doc.text(`${ex.muscleGroup}  |  ${ex.sets}×${ex.reps}  |  Descanso: ${ex.restSeconds}s`, margin + 3, y + 14);
      if (ex.notes) {
        const noteLines = doc.splitTextToSize(ex.notes, contentW - 6);
        doc.text(noteLines, margin + 3, y + 20);
      }
      y += 32;
    }

    y += 2;
    heading("Enfriamiento", 12, [100, 180, 255]);
    body(day.cooldown, 10);
  }

  // Nutrition
  doc.addPage();
  doc.setFillColor(15, 20, 25);
  doc.rect(0, 0, pageW, pageH, "F");
  y = margin;

  heading("Plan Nutricional", 18);
  separator();

  if (plan.nutrition) {
    body(`Calorías: ${plan.nutrition.dailyCalories} kcal/día`, 11);
    body(`Proteína: ${plan.nutrition.dailyMacros?.protein}g | Carbohidratos: ${plan.nutrition.dailyMacros?.carbs}g | Grasas: ${plan.nutrition.dailyMacros?.fats}g`, 11);
    y += 4;
    heading("Comidas del Día", 13);

    for (const meal of plan.nutrition.meals || []) {
      checkPage(20);
      doc.setFillColor(25, 30, 35);
      doc.roundedRect(margin, y, contentW, 18, 2, 2, "F");
      doc.setFontSize(10);
      doc.setTextColor(80, 200, 120);
      doc.setFont("helvetica", "bold");
      doc.text(`${meal.time} — ${meal.name} (${meal.calories} kcal)`, margin + 3, y + 7);
      doc.setFontSize(9);
      doc.setTextColor(180, 180, 180);
      doc.setFont("helvetica", "normal");
      doc.text((meal.foods || []).join(", "), margin + 3, y + 13);
      y += 22;
    }

    y += 4;
    heading("Hidratación", 12, [100, 180, 255]);
    body(plan.nutrition.hydration, 10);

    if (plan.nutrition.supplementation) {
      y += 2;
      heading("Suplementación", 12, [180, 100, 255]);
      body(plan.nutrition.supplementation, 10);
    }

    y += 4;
    heading("Tips de Nutrición", 12);
    for (const tip of plan.nutrition.tips || []) {
      body(`• ${tip}`, 10);
    }
  }

  if (plan.generalAdvice) {
    checkPage(20);
    y += 4;
    heading("Consejos Generales", 13);
    body(plan.generalAdvice, 10);
  }

  doc.save(`evigym-plan-${new Date().toISOString().split("T")[0]}.pdf`);
}
