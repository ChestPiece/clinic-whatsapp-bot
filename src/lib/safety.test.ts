import { expect, test } from "vitest";
import { emergencyReply, isEmergency, isStop } from "./safety";

test("flags life-threatening messages in English and Arabic", () => {
  for (const t of [
    "I can't breathe properly",
    "my gum won't stop bleeding",
    "swelling near my eye after extraction",
    "had an accident, tooth knocked out",
    "لا أستطيع التنفس",
    "النزيف لا يتوقف",
    "ما اقدر ابلع",
  ]) expect(isEmergency(t), t).toBe(true);
});

test("ordinary dental requests are not emergencies", () => {
  for (const t of ["I have a toothache, can I come today?", "عندي ألم في السن", "do you take emergency appointments?", "book cleaning"])
    expect(isEmergency(t), t).toBe(false);
});

test("reply language follows the patient's script", () => {
  expect(emergencyReply("النزيف لا يتوقف", "+971 4")).toContain("998");
  expect(emergencyReply("النزيف لا يتوقف", null)).toMatch(/[؀-ۿ]/);
  expect(emergencyReply("can't breathe", "+971 4")).toMatch(/^If this is an emergency.*Clinic phone: \+971 4$/);
});

test("heavy bleeding and spreading swelling are emergencies, Arabizi too", () => {
  for (const t of [
    "I have severe bleeding from my gum",
    "it's bleeding a lot",
    "heavy bleeding after extraction",
    "my face is swelling up",
    "jaw swelling and fever",
    "ma a2dar atnafas",
    "mo gader atnafas",
    "el dam ma wa2af",
  ]) expect(isEmergency(t), t).toBe(true);
});

test("an accident in the past is not an emergency", () => {
  for (const t of ["I had an accident last year and my crown fell off, can I book?", "accident 2 years ago, need a check-up"])
    expect(isEmergency(t), t).toBe(false);
});

test("STOP opts out of follow-ups, but the Arabic word for cancel does not", () => {
  for (const t of ["STOP", "stop", " Stop ", "توقف", "unsubscribe"]) expect(isStop(t), t).toBe(true);
  for (const t of ["الغاء", "stop sending me the wrong time", "cancel"]) expect(isStop(t), t).toBe(false);
});
