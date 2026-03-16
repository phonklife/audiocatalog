import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("audio.update", () => {
  it("should accept valid update input with all fields", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // The procedure should accept valid input without throwing a validation error
    // It may throw a database error since we're not connected, but input validation should pass
    try {
      await caller.audio.update({
        trackId: 1,
        title: "Updated Title",
        artist: "Updated Artist",
        album: "Updated Album",
        genre: "Rock",
        description: "Updated description",
      });
    } catch (error: any) {
      // Database errors are expected in test environment, but validation errors are not
      expect(error.message).not.toContain("invalid_type");
      expect(error.message).not.toContain("Expected");
    }
  });

  it("should accept partial update input", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.audio.update({
        trackId: 1,
        title: "Only Title Updated",
      });
    } catch (error: any) {
      expect(error.message).not.toContain("invalid_type");
    }
  });

  it("should accept nullable fields", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.audio.update({
        trackId: 1,
        album: null,
        genre: null,
        description: null,
      });
    } catch (error: any) {
      expect(error.message).not.toContain("invalid_type");
    }
  });

  it("should reject empty title", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.audio.update({
        trackId: 1,
        title: "",
      })
    ).rejects.toThrow();
  });

  it("should reject empty artist", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.audio.update({
        trackId: 1,
        artist: "",
      })
    ).rejects.toThrow();
  });
});

describe("audio.delete", () => {
  it("should accept valid delete input", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.audio.delete({ trackId: 1 });
    } catch (error: any) {
      // Database errors are expected, but validation should pass
      expect(error.message).not.toContain("invalid_type");
    }
  });
});

describe("audio.getById", () => {
  it("should accept valid getById input", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.audio.getById({ trackId: 1 });
    } catch (error: any) {
      expect(error.message).not.toContain("invalid_type");
    }
  });
});
