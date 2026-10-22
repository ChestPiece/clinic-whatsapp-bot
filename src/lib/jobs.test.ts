import { expect, test } from "vitest";
import { quietHours, reminderDue, reminderText } from "./jobs";

const DUBAI = 240;

test("no outbound messages before 9 am or from 9 pm clinic time", () => {
  expect(quietHours(new Date("2026-10-22T04:59:00Z"), DUBAI)).toBe(true); // 08:59
  expect(quietHours(new Date("2026-10-22T05:00:00Z"), DUBAI)).toBe(false); // 09:00
  expect(quietHours(new Date("2026-10-22T16:59:00Z"), DUBAI)).toBe(false); // 20:59
  expect(quietHours(new Date("2026-10-22T17:00:00Z"), DUBAI)).toBe(true); // 21:00
});

test("each visit gets a 24h and a 2h reminder, once each, only if booked before that window", () => {
  const now = new Date("2026-10-22T08:00:00Z");
  const at = (hours: number) => new Date(now.getTime() + hours * 3_600_000).toISOString();
  const visit = (startH: number, createdH = -48, r24: string | null = null, r2: string | null = null) => ({
    starts_at: at(startH),
    created_at: at(createdH),
    reminded_24h_at: r24,
    reminded_2h_at: r2,
  });
  expect(reminderDue(visit(30), now)).toBe(null); // too early
  expect(reminderDue(visit(23), now)).toBe("24h");
  expect(reminderDue(visit(23, -48, at(-1)), now)).toBe(null); // already sent
  expect(reminderDue(visit(23, -0.5), now)).toBe(null); // booked 30 min ago, inside the 24h window
  expect(reminderDue(visit(1.5, -48, at(-20)), now)).toBe("2h");
  expect(reminderDue(visit(1.5, -48, null), now)).toBe("2h"); // missed 24h is skipped, not sent late
  expect(reminderDue(visit(1.5, -48, at(-20), at(-0.2)), now)).toBe(null);
  expect(reminderDue(visit(1.5, -0.25), now)).toBe(null); // booked 15 min ago, inside the 2h window
  expect(reminderDue(visit(0.25), now)).toBe(null); // too close to bother
});

test("reminder text is bilingual, names the visit and asks for 1 or 2", () => {
  const text = reminderText({ name: "Anas Altaf", service: "Check-up", startsAt: new Date("2026-10-23T12:00:00Z"), clinic: "Sample Smile Dental", offsetMin: DUBAI });
  expect(text).toContain("Hi Anas");
  expect(text).toContain("Check-up");
  expect(text).toMatch(/Fri, Oct 23.*4:00\sPM/);
  expect(text).toContain("Reply 1 to confirm or 2 to change it");
  expect(text).toMatch(/[؀-ۿ]/); // Arabic part
  expect(reminderText({ name: null, service: "Check-up", startsAt: new Date(), clinic: "X", offsetMin: DUBAI })).toMatch(/^Hi,/);
});
