import { useSession } from "@tanstack/react-start/server";
import { getEnvConfig } from "./env";

export type AppSessionData = {
	userId?: number;
};

const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Encrypted/signed session cookie via TanStack Start (h3 useSession).
 * Uses JWT_SECRET as the session encryption password (32+ chars, same as env schema).
 */
export async function useAppSession() {
	const env = getEnvConfig();
	return useSession<AppSessionData>({
		name: "app-session",
		password: env.JWT_SECRET,
		cookie: {
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			httpOnly: true,
			path: "/",
			maxAge: SESSION_MAX_AGE,
		},
	});
}

export async function setSessionUserId(userId: number): Promise<void> {
	const session = await useAppSession();
	await session.update({ userId });
}

export async function clearAppSession(): Promise<void> {
	const session = await useAppSession();
	await session.clear();
}

export async function getSessionUserId(): Promise<number | undefined> {
	const session = await useAppSession();
	const raw = session.data.userId;
	if (typeof raw === "number" && Number.isFinite(raw)) {
		return raw;
	}
	if (typeof raw === "string") {
		const n = parseInt(raw, 10);
		return Number.isNaN(n) ? undefined : n;
	}
	return undefined;
}
