import { describe, it, expect } from "bun:test";
import { appRouter } from "../router";

describe("Router", () => {
  it("should return hello world", async () => {
    const caller = appRouter.createCaller({ admin: null });
    const result = await caller.hello();
    expect(result).toBe("Hello, world!");
  });

  it("should have ping subscription", async () => {
    const caller = appRouter.createCaller({ admin: null });
    expect(typeof caller.ping).toBe("function");
    const subscription = caller.ping();
    expect(subscription).toBeDefined();
  });
});
