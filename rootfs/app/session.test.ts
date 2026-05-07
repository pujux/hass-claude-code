import { describe, test, expect } from "bun:test";
import { appendScrollback, SCROLLBACK_LIMIT } from "./session.ts";

describe("appendScrollback", () => {
  test("appends data to empty scrollback", () => {
    const session = { scrollback: "" } as any;
    appendScrollback(session, "hello\r\n");
    expect(session.scrollback).toBe("hello\r\n");
  });

  test("appends data to existing scrollback", () => {
    const session = { scrollback: "existing" } as any;
    appendScrollback(session, "more");
    expect(session.scrollback).toBe("existingmore");
  });

  test("caps scrollback at SCROLLBACK_LIMIT bytes by dropping oldest bytes", () => {
    const session = { scrollback: "x".repeat(SCROLLBACK_LIMIT) } as any;
    appendScrollback(session, "NEW");
    expect(session.scrollback.length).toBe(SCROLLBACK_LIMIT);
    expect(session.scrollback.endsWith("NEW")).toBe(true);
    expect(session.scrollback.startsWith("x")).toBe(true);
  });

  test("does not truncate scrollback that is exactly at limit after append", () => {
    const data = "y".repeat(10);
    const existing = "x".repeat(SCROLLBACK_LIMIT - 10);
    const session = { scrollback: existing } as any;
    appendScrollback(session, data);
    expect(session.scrollback.length).toBe(SCROLLBACK_LIMIT);
  });

  test("does not truncate scrollback below limit", () => {
    const session = { scrollback: "short" } as any;
    appendScrollback(session, "data");
    expect(session.scrollback).toBe("shortdata");
    expect(session.scrollback.length).toBeLessThanOrEqual(SCROLLBACK_LIMIT);
  });
});
