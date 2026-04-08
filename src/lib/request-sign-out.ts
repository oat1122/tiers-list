export async function requestSignOut(fetchImpl: typeof fetch = fetch) {
  const response = await fetchImpl("/api/auth/sign-out", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: "{}",
  });

  if (!response.ok) {
    throw new Error("ออกจากระบบไม่สำเร็จ");
  }
}
