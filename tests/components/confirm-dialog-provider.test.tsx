// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ConfirmDialogProvider,
  useConfirmDialog,
} from "@/components/confirm-dialog-provider";

function ConfirmHarness() {
  const { confirm } = useConfirmDialog();

  return (
    <button
      type="button"
      id="open-confirm"
      onClick={async () => {
        const result = await confirm({
          title: "Delete item?",
          description: "This action cannot be undone",
          confirmLabel: "Delete",
          cancelLabel: "Keep it",
          variant: "destructive",
        });

        const output = document.getElementById("confirm-result");

        if (output) {
          output.textContent = result ? "confirmed" : "cancelled";
        }
      }}
    >
      open
    </button>
  );
}

describe("ConfirmDialogProvider", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("opens and resolves the confirm dialog", async () => {
    await act(async () => {
      root.render(
        <ConfirmDialogProvider>
          <ConfirmHarness />
          <div id="confirm-result" />
        </ConfirmDialogProvider>,
      );
    });

    const trigger = document.getElementById("open-confirm");

    await act(async () => {
      trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(document.body.textContent).toContain("Delete item?");
    expect(document.body.textContent).toContain("This action cannot be undone");

    const buttons = Array.from(document.querySelectorAll("button"));
    const confirmButton = buttons.find((button) => button.textContent === "Delete");

    await act(async () => {
      confirmButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(document.getElementById("confirm-result")?.textContent).toBe(
      "confirmed",
    );
  });
});
