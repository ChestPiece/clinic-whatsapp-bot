// Life-threatening signs get a fixed reply before the model runs, so this never depends on the LLM.
// Narrow on purpose: an ordinary toothache must still flow into booking.
const EMERGENCY = new RegExp(
  [
    "(can'?t|cannot|unable to) (breathe|swallow)",
    "unconscious|fainted",
    "(won'?t|not|doesn'?t) stop bleeding|(severe|heavy|heavily|serious) bleeding|bleeding (a lot|heavily|badly)",
    "swelling (near|to|in|around) (my |the )?(eye|neck|throat)|(face|jaw|neck) (is )?swell|(face|jaw|neck) swelling",
    // Accident now, not "an accident last year".
    "accident(?![^.?!]*\\b(last|ago|years?|months?)\\b)",
    // Arabizi (Gulf/Levant chat spelling)
    "(ma|mo|mu) (a2dar|agdar|gader|qader|a2der) (atnafas|etnafas|abla3|ebla3)|(el|al)? ?dam (ma|mo) (wa2af|waqaf|yew2af|yoqaf)",
    "لا (أستطيع|استطيع) (التنفس|البلع)|ما (اقدر|أقدر) (اتنفس|أتنفس|ابلع|أبلع)|فاقد الوعي|إغماء|اغماء|(النزيف|الدم) (لا|ما) (يتوقف|وقف)|حادث",
  ].join("|"),
  "i",
);

export const isEmergency = (text: string) => EMERGENCY.test(text);

export const emergencyReply = (text: string, clinicPhone: string | null) =>
  /[؀-ۿ]/.test(text)
    ? `إذا كانت حالة طارئة، اتصل بالإسعاف على 998 فوراً أو توجه إلى أقرب قسم طوارئ.${clinicPhone ? ` هاتف العيادة: ${clinicPhone}` : ""}`
    : `If this is an emergency, call 998 (ambulance) now or go to the nearest emergency department.${clinicPhone ? ` Clinic phone: ${clinicPhone}` : ""}`;
