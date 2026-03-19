#!/usr/bin/env node

import "dotenv/config";

/**
 * Non-interactive bootstrap for e2e tests.
 * Sets test env vars and runs db:push against a dedicated test database.
 * Run before starting the app for e2e: use the same env when starting the server.
 *
 * Usage:
 *   pnpm test:e2e-bootstrap
 *   Then: DATABASE_URL=./db.test.sqlite NODE_ENV=test SITE_URL=http://localhost:3001 pnpm dev --port 3001
 *   In another terminal: pnpm test:e2e
 */

import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

function main(): void {
	// Require .env so we have JWT_SECRET, SITE_NAME, RP_ID
	const envPath = join(projectRoot, ".env");
	if (!existsSync(envPath)) {
		console.error("Missing .env. Run 'pnpm setup-db' first.");
		process.exit(1);
	}

	// Override for test DB and e2e server URL
	process.env.DATABASE_URL = "./db.test.sqlite";
	process.env.NODE_ENV = "test";
	process.env.SITE_URL = "http://localhost:3001";
	const testDbPath = join(projectRoot, "db.test.sqlite");

	if (existsSync(testDbPath)) {
		rmSync(testDbPath);
	}

	console.log("E2E bootstrap: pushing schema to db.test.sqlite...");
	execSync("pnpm db:push", {
		stdio: "inherit",
		cwd: projectRoot,
		env: process.env,
	});
	console.log("E2E bootstrap done. Start the server with:");
	console.log(
		"  DATABASE_URL=./db.test.sqlite NODE_ENV=test SITE_URL=http://localhost:3001 pnpm dev --port 3001",
	);
	console.log("Then run: pnpm test:e2e");
}

main();
