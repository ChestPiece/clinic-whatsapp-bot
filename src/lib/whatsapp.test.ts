import { expect, test } from "vitest";
import { normInstance, parseWebhook, secretMatches } from "./whatsapp";

// Shape based on UltraMsg docs; replace with a real recorded payload after the first live message.
const payload = (data: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({
  event_type: "message_received",
  instanceId: "12345",
  data: { id: "false_971500000000@c.us_ABC", from: "971500000000@c.us", type: "chat", body: "Hi", media: "", fromMe: false, pushname: "Sample", ...data },
  ...extra,
});

test("parses a text message with its instance id", () => {
  expect(parseWebhook(payload({}))).toMatchObject({ instanceId: "12345", from: "971500000000@c.us", type: "chat", body: "Hi", mediaUrl: null });
});

test("instance id is stored and matched without the 'instance' prefix", () => {
  expect(normInstance("instance12345")).toBe("12345");
  expect(normInstance("12345")).toBe("12345");
  expect(parseWebhook(payload({}, { instanceId: "instance12345" }))?.instanceId).toBe("12345");
  expect(parseWebhook(payload({}, { instanceId: 12345 }))?.instanceId).toBe("12345");
  expect(parseWebhook(payload({}, { instanceId: undefined }))).toBeNull();
});

test("keeps media url for image and voice note", () => {
  expect(parseWebhook(payload({ type: "image", media: "https://x/img.jpg" }))?.mediaUrl).toBe("https://x/img.jpg");
  expect(parseWebhook(payload({ type: "ptt", body: "", media: "https://x/v.ogg" }))?.type).toBe("ptt");
});

test("ignores own messages, groups, other events", () => {
  expect(parseWebhook(payload({ fromMe: true }))).toBeNull();
  expect(parseWebhook(payload({ from: "1203630@g.us" }))).toBeNull();
  expect(parseWebhook(payload({}, { event_type: "message_ack" }))).toBeNull();
  expect(parseWebhook(null)).toBeNull();
});

test("secret check", () => {
  expect(secretMatches("abc", "abc")).toBe(true);
  expect(secretMatches("abd", "abc")).toBe(false);
  expect(secretMatches(null, "abc")).toBe(false);
  expect(secretMatches("abc", undefined)).toBe(false);
});
