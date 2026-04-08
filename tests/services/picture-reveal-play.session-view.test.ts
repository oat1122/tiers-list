import { describe, expect, it } from "vitest";
import { getPictureRevealSessionView } from "@/services/picture-reveal-play.service";

describe("picture reveal play service compatibility", () => {
  it("throws a 410 error because session-based play has been removed", async () => {
    await expect(
      getPictureRevealSessionView("game-1", "session-1", null, true),
    ).rejects.toMatchObject({
      status: 410,
      message:
        "Picture reveal session routes have been removed. Use the host-run client flow instead.",
    });
  });
});
