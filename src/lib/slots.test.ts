import { expect, test } from "vitest";
import { freeSlots, spreadSlots, localDate, localTime, toUtc, type Hours } from "./slots";

const UAE = 240;
const hours: Hours = { thu: [["09:00", "10:00"], ["16:00", "17:00"]], fri: [] };
const past = new Date("2000-01-01T00:00:00Z");
// 2026-10-22 is a Thursday, 2026-10-23 a Friday, 2026-10-24 a Saturday.

test("lists 15-minute starts that fit inside each window, lunch gap skipped", () => {
  expect(freeSlots(hours, [], 30, "2026-10-22", past, UAE)).toEqual([
    "09:00", "09:15", "09:30", "16:00", "16:15", "16:30",
  ]);
});

test("closed and unlisted days have no slots", () => {
  expect(freeSlots(hours, [], 30, "2026-10-23", past, UAE)).toEqual([]);
  expect(freeSlots(hours, [], 30, "2026-10-24", past, UAE)).toEqual([]);
  expect(freeSlots(hours, [], 30, "not-a-date", past, UAE)).toEqual([]);
});

test("removes slots overlapping a booking, keeps touching ones", () => {
  const booked = [{ start: toUtc("2026-10-22", "09:15", UAE), end: toUtc("2026-10-22", "09:45", UAE) }];
  expect(freeSlots(hours, booked, 30, "2026-10-22", past, UAE).slice(0, 2)).toEqual(["16:00", "16:15"]);
  const early = [{ start: toUtc("2026-10-22", "09:30", UAE), end: toUtc("2026-10-22", "10:00", UAE) }];
  expect(freeSlots(hours, early, 30, "2026-10-22", past, UAE)).toContain("09:00");
});

test("skips times already passed", () => {
  const now = toUtc("2026-10-22", "16:10", UAE);
  expect(freeSlots(hours, [], 30, "2026-10-22", now, UAE)).toEqual(["16:15", "16:30"]);
});

test("spreadSlots picks evenly across the day, earliest first", () => {
  const free = ["09:00", "09:15", "09:30", "09:45", "16:00", "16:15", "16:30", "16:45", "17:00"];
  expect(spreadSlots(free, 3)).toEqual(["09:00", "16:00", "17:00"]);
  expect(spreadSlots(["09:00", "09:15"], 4)).toEqual(["09:00", "09:15"]);
  expect(spreadSlots([], 4)).toEqual([]);
});

test("local time conversion uses the clinic offset", () => {
  const d = toUtc("2026-10-22", "09:00", UAE);
  expect(d.toISOString()).toBe("2026-10-22T05:00:00.000Z");
  expect([localDate(d, UAE), localTime(d, UAE)]).toEqual(["2026-10-22", "09:00"]);
});
