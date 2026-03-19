import { expect, test } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3001";

/** Poll the test-only endpoint for the last emitted OTP (avoids SSE timing issues in e2e). */
async function getLastOtp(
	type: "signup-otp" | "login-otp",
): Promise<{ code: string }> {
	const maxAttempts = 20;
	for (let i = 0; i < maxAttempts; i++) {
		const res = await fetch(`${BASE_URL}/test-otp-latest?type=${type}`);
		if (!res.ok) throw new Error(`test-otp-latest failed: ${res.status}`);
		const data = (await res.json()) as { code?: string };
		if (data.code) return { code: data.code };
		await new Promise((r) => setTimeout(r, 200));
	}
	throw new Error(`No ${type} received within timeout`);
}

test.describe("Auth OTP flow (signup, logout, login via SSE)", () => {
	test("signup -> logout -> login via email code using SSE OTP", async ({
		page,
	}) => {
		test.setTimeout(60000);
		const testEmail = `e2e-${Date.now()}@example.com`;
		const testName = "E2E User";

		await page.goto(`${BASE_URL}/signup`, { waitUntil: "networkidle" });

		await page.getByLabel(/name/i).fill(testName);
		await page.getByLabel(/email/i).fill(testEmail);
		await page.getByRole("button", { name: "Sign Up" }).click();

		await expect(page).toHaveURL(/\/signup\/[^/]+/, { timeout: 15000 });

		// 1. Retrieve signup OTP from test endpoint (server stored it when broadcasting)
		const signupOtp = await getLastOtp("signup-otp");
		expect(signupOtp.code).toHaveLength(8);

		// 2. Enter signup OTP (wait for code form then type)
		await page.getByText(/Enter the 8-character/).waitFor({ state: "visible", timeout: 10000 });
		await page.locator("[data-slot='input-otp']").click();
		await page.keyboard.type(signupOtp.code);

		await page.getByRole("button", { name: /Verify Code/ }).click();

		await expect(page).toHaveURL(/\/user-settings/);

		// 3. Logout
		await page.goto(`${BASE_URL}/logout`);
		await page.getByRole("button", { name: /log out/i }).click();

		await expect(page).toHaveURL(/\/login/);

		// 4. Request login code; start SSE listener then submit
		await page.getByRole("button", { name: /login via email code/i }).click();
		await expect(page).toHaveURL(/\/login-request-code/);

		await page.getByLabel(/email/i).fill(testEmail);
		await page.getByRole("button", { name: /Send Login Code/ }).click();

		await expect(page).toHaveURL(/\/login-via-code\/[^/]+/, { timeout: 15000 });

		// 4. Retrieve login OTP from test endpoint
		const loginOtp = await getLastOtp("login-otp");
		expect(loginOtp.code).toHaveLength(8);

		// 5. Enter login OTP
		await page.getByText(/Enter the 8-character/).waitFor({ state: "visible", timeout: 10000 });
		await page.locator("[data-slot='input-otp']").click();
		await page.keyboard.type(loginOtp.code);

		await page.getByRole("button", { name: /Verify Code/ }).click();

		await expect(page).toHaveURL(/\/(user-settings|$)/);
	});
});
