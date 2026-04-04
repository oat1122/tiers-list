import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Kanit: () => ({
    variable: "font-sans",
  }),
}));

vi.mock("@/components/theme-provider", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-theme-provider>{children}</div>
  ),
}));

vi.mock("@/components/confirm-dialog-provider", () => ({
  ConfirmDialogProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-confirm-provider>{children}</div>
  ),
}));

vi.mock("@/components/ui/sonner", () => ({
  AppToaster: () => <div data-app-toaster />,
}));

describe("RootLayout providers", () => {
  it("mounts theme, confirm, and toaster providers around children", async () => {
    const { default: RootLayout } = await import("@/app/layout");
    const markup = renderToStaticMarkup(
      RootLayout({
        children: <div data-page-content />,
      }),
    );

    expect(markup).toContain("data-theme-provider");
    expect(markup).toContain("data-confirm-provider");
    expect(markup).toContain("data-app-toaster");
    expect(markup).toContain("data-page-content");
  });
});
