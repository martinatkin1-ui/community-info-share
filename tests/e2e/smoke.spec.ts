import { expect, test } from "@playwright/test";

test("home page renders hero and tabs", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /find local support/i })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main navigation" }).getByRole("tab", { name: "Events" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main navigation" }).getByRole("tab", { name: "Organisations" })).toBeVisible();
});

test("events page loads discovery UI", async ({ page }) => {
  await page.goto("/events");
  await expect(page.getByRole("button", { name: /Find Events/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Find Support Services/i })).toBeVisible();
});

test("API health checks for public endpoints", async ({ request }) => {
  const heroRes = await request.get("/api/hero-image");
  expect(heroRes.status()).toBe(200);
  const heroPayload = await heroRes.json();
  expect(typeof heroPayload.url).toBe("string");

  const meRes = await request.get("/api/volunteer/me");
  expect(meRes.status()).toBe(200);

  const volunteerFailRes = await request.post("/api/volunteer/auth", {
    data: { keyCode: "INVALID" },
  });
  expect([400, 401]).toContain(volunteerFailRes.status());
});
