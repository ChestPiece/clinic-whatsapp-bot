import { expect, test } from "vitest";
import { parseWebhook, secretMatches } from "./whatsapp";

// Shape based on UltraMsg docs; replace with a real recorded payload after the first live message.
const payload = (data: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({
  event_type: "message_received",
  instanceId: "12345",
  data: { id: "false_971500000000@c.us_ABC", from: "971500000000@c.us", type: "chat", body: "Hi", media: "", fromMe: false, pushname: "Sample", ...data },
  ...extra,
});

test("parses a text message", () => {
  expect(parseWebhook(payload({}), "12345")).toMatchObject({ from: "971500000000@c.us", type: "chat", body: "Hi", mediaUrl: null });
});

test("matches env id 'instance12345' against payload id '12345'", () => {
  expect(parseWebhook(payload({}), "instance12345")).not.toBeNull();
  expect(parseWebhook(payload({}), "instance99999")).toBeNull();
  expect(parseWebhook(payload({}), "")).toBeNull();
});

test("keeps media url for image and voice note", () => {
  expect(parseWebhook(payload({ type: "image", media: "https://x/img.jpg" }), "12345")?.mediaUrl).toBe("https://x/img.jpg");
  expect(parseWebhook(payload({ type: "ptt", body: "", media: "https://x/v.ogg" }), "12345")?.type).toBe("ptt");
});

test("ignores own messages, groups, other events, wrong instance", () => {
  expect(parseWebhook(payload({ fromMe: true }), "12345")).toBeNull();
  expect(parseWebhook(payload({ from: "1203630@g.us" }), "12345")).toBeNull();
  expect(parseWebhook(payload({}, { event_type: "message_ack" }), "12345")).toBeNull();
  expect(parseWebhook(payload({}), "99999")).toBeNull();
  expect(parseWebhook(null, "12345")).toBeNull();
});

test("secret check", () => {
  expect(secretMatches("abc", "abc")).toBe(true);
  expect(secretMatches("abd", "abc")).toBe(false);
  expect(secretMatches(null, "abc")).toBe(false);
  expect(secretMatches("abc", undefined)).toBe(false);
});
