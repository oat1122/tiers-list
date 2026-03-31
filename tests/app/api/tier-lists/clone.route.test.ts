import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authGetSession: vi.fn(),
  createFromTemplate: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mocks.authGetSession,
    },
  },
}));

vi.mock("@/services/tier-lists.service", () => ({
  createFromTemplate: mocks.createFromTemplate,
}));

import { POST } from "@/app/api/tier-lists/[id]/clone/route";

function params(id = "template-1") {
  return { params: Promise.resolve({ id }) };
}

describe("/api/tier-lists/[id]/clone route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when the template is not cloneable", async () => {
    mocks.authGetSession.mockResolvedValue({
      user: { id: "user-1", role: "user" },
    });
    mocks.createFromTemplate.mockRejectedValue(new Error("Template not found"));

    const response = await POST(new Request("http://localhost") as never, params());

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Template not found",
    });
  });
});
