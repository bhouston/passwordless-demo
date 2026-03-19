import { expect, test } from "@playwright/test";
import { logout, signUpViaOtp } from "./helpers/auth";
import {
	type WebAuthnHarness,
	installVirtualAuthenticator,
	setNextAuthenticationError,
	setNextRegistrationError,
	setWebAuthnSupport,
} from "./helpers/webauthn";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3001";

test.describe("Auth passkey flow", () => {
	let webauthn: WebAuthnHarness | undefined;

	test.afterEach(async () => {
		if (!webauthn) {
			return;
		}

		await webauthn.resetCredentials();
		await webauthn.removeVirtualAuthenticator();
		webauthn = undefined;
	});

	test("signup -> register passkey -> logout -> login with passkey", async ({
		page,
	}) => {
		test.setTimeout(60000);
		const testEmail = `passkey-${Date.now()}@example.com`;
		const testName = "Passkey E2E User";

		webauthn = await installVirtualAuthenticator(page);

		await signUpViaOtp(page, { email: testEmail, name: testName });
		await expect(page.getByText(/No passkey registered/i)).toBeVisible();

		await page.getByRole("button", { name: /Add Passkey/i }).click();

		await expect(
			page.getByText(/Passkey registered successfully!/i),
		).toBeVisible();
		await expect(page.getByText("Passkey registered", { exact: true })).toBeVisible();

		const credentials = await webauthn.listCredentials();
		expect(credentials).toHaveLength(1);

		await logout(page);

		await page.goto(`${BASE_URL}/login?redirectTo=%2Fuser-settings`);
		await page.getByRole("button", { name: /Login with Passkey/i }).click();

		await expect(page).toHaveURL(/\/user-settings/, { timeout: 15000 });
		await expect(page.getByText("Passkey registered", { exact: true })).toBeVisible();
	});

	test("shows registration cancelled when passkey setup is cancelled", async ({
		page,
	}) => {
		const testEmail = `passkey-cancel-${Date.now()}@example.com`;

		await signUpViaOtp(page, { email: testEmail, name: "Cancel Setup User" });
		await setNextRegistrationError(page, {
			name: "NotAllowedError",
			message: "The operation was cancelled.",
		});

		await page.getByRole("button", { name: /Add Passkey/i }).click();

		await expect(page.getByText(/Registration cancelled/i)).toBeVisible();
		await expect(page.getByText(/No passkey registered/i)).toBeVisible();
	});

	test("shows an authentication cancelled error", async ({ page }) => {
		await setNextAuthenticationError(page, {
			name: "NotAllowedError",
			message: "The operation was cancelled.",
		});

		await page.goto(`${BASE_URL}/login-passkey?redirectTo=%2Fuser-settings`);

		await expect(
			page.getByText(/Authentication was cancelled or not allowed by your device\./i),
		).toBeVisible();
	});

	test("shows a missing passkey error when no credential is available", async ({
		page,
	}) => {
		await setNextAuthenticationError(page, {
			name: "InvalidStateError",
			message: "No passkey available",
		});

		await page.goto(`${BASE_URL}/login-passkey?redirectTo=%2Fuser-settings`);

		await expect(
			page.getByText(/No passkey found\. Please use email link to log in\./i),
		).toBeVisible();
	});

	test("shows the unsupported browser message when WebAuthn is unavailable", async ({
		page,
	}) => {
		await setWebAuthnSupport(page, false);

		await page.goto(`${BASE_URL}/login-passkey?redirectTo=%2Fuser-settings`);

		await expect(
			page.getByText(/Passkeys are not supported in this browser/i),
		).toBeVisible();
	});
});
