import { test } from "@playwright/test";
import { loginViaEmailCode, logout, signUpViaOtp } from "./helpers/auth";

test.describe("Auth OTP flow (signup, logout, login via SSE)", () => {
	test("signup -> logout -> login via email code using SSE OTP", async ({
		page,
	}) => {
		test.setTimeout(60000);
		const testEmail = `e2e-${Date.now()}@example.com`;
		const testName = "E2E User";

		await signUpViaOtp(page, { email: testEmail, name: testName });
		await logout(page);
		await loginViaEmailCode(page, { email: testEmail });
	});
});
