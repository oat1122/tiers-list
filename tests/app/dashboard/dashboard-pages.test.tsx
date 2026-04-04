import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const headersMock = vi.fn();
const getSessionMock = vi.fn();
const redirectMock = vi.fn((destination: string) => {
  throw new Error(`REDIRECT:${destination}`);
});

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: getSessionMock,
    },
  },
}));

vi.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => null,
}));

describe("dashboard pages", () => {
  beforeEach(() => {
    headersMock.mockReset();
    getSessionMock.mockReset();
    redirectMock.mockClear();
    headersMock.mockResolvedValue(new Headers());
  });

  it("renders the portal page for admin users", async () => {
    getSessionMock.mockResolvedValue({
      user: {
        id: "user-1",
        name: "Admin",
        email: "admin@example.com",
        role: "admin",
      },
    });

    const { default: DashboardPage } = await import("@/app/dashboard/page");
    const markup = renderToStaticMarkup(await DashboardPage());

    expect(markup).toContain("/dashboard/tier-lists");
    expect(markup).toContain("/dashboard/picture-reveal");
    expect(markup).toContain("Admin Portal");
  });

  it("redirects unauthenticated users away from the portal", async () => {
    getSessionMock.mockResolvedValue(null);

    const { default: DashboardPage } = await import("@/app/dashboard/page");

    await expect(DashboardPage()).rejects.toThrow("REDIRECT:/sign-in");
  });

  it("redirects legacy template route to the new tier-lists path", async () => {
    const { default: LegacyEditTemplatePage } = await import(
      "@/app/dashboard/templates/[id]/edit-template/page"
    );

    await expect(
      LegacyEditTemplatePage({
        params: Promise.resolve({ id: "template-1" }),
      } as PageProps<"/dashboard/templates/[id]/edit-template">),
    ).rejects.toThrow(
      "REDIRECT:/dashboard/tier-lists/templates/template-1/edit-template",
    );
  });
});
