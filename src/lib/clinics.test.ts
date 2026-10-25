import { expect, test } from "vitest";
import { personaName } from "./clinics";

test("the assistant is called Sara unless the clinic names it", () => {
  expect(personaName({ persona: {} })).toBe("Sara");
  expect(personaName({ persona: { name: "" } })).toBe("Sara");
  expect(personaName({ persona: { name: "Layla" } })).toBe("Layla");
});
