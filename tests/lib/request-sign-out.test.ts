import { describe, expect, it, vi } from "vitest";
import { requestSignOut } from "@/lib/request-sign-out";

describe("requestSignOut", () => {
  it("posts to the better auth sign-out endpoint without a JSON or form body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    await requestSignOut(fetchMock);

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/sign-out", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: "{}",
    });
  });

  it("throws when sign out fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 415,
      }),
    );

    await expect(requestSignOut(fetchMock)).rejects.toThrow(
      "ออกจากระบบไม่สำเร็จ",
    );
  });
});
