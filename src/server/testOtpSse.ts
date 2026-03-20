import { getEnvConfig } from './env';

export type TestOtpEventType = 'signup-otp' | 'login-otp';

export interface BroadcastTestOtpPayload {
  type: TestOtpEventType;
  email: string;
  code: string;
  name?: string;
  token?: string;
}

const connections = new Map<string, ReadableStreamDefaultController<Uint8Array>>();

/** Last emitted payloads (test only) so e2e can fetch OTP without relying on SSE timing. */
const lastPayloads = new Map<
  TestOtpEventType,
  {
    email: string;
    code: string;
    issuedAt: string;
    name?: string;
    token?: string;
  }
>();

function formatSseMessage(eventName: string, payload: unknown): Uint8Array {
  const eventLine = `event: ${eventName}\n`;
  const dataLine = `data: ${JSON.stringify(payload)}\n\n`;
  return new TextEncoder().encode(eventLine + dataLine);
}

function sendToConnection(
  controller: ReadableStreamDefaultController<Uint8Array>,
  eventName: string,
  payload: unknown,
): void {
  try {
    controller.enqueue(formatSseMessage(eventName, payload));
  } catch {
    // Stream already closed (e.g. client disconnected)
  }
}

/**
 * Register an SSE connection for receiving OTP events.
 * Call from the GET handler when opening the stream.
 */
export function registerTestOtpConnection(
  connectionId: string,
  controller: ReadableStreamDefaultController<Uint8Array>,
): void {
  connections.set(connectionId, controller);
}

/**
 * Unregister an SSE connection (e.g. on abort).
 */
export function unregisterTestOtpConnection(connectionId: string): void {
  connections.delete(connectionId);
}

/**
 * Whether the SSE endpoint should be enabled (development or test only).
 */
export function isTestOtpSseEnabled(): boolean {
  const env = getEnvConfig();
  return env.NODE_ENV === 'development' || env.NODE_ENV === 'test';
}

/**
 * Log OTP to console and broadcast to connected SSE clients.
 * Only runs when NODE_ENV is "development" or "test".
 * Use for signup and login code issuance in auth.ts.
 */
export function broadcastTestOtp(payload: BroadcastTestOtpPayload): void {
  const env = getEnvConfig();
  if (env.NODE_ENV !== 'development' && env.NODE_ENV !== 'test') {
    return;
  }

  const { type, email, code, name, token } = payload;
  const issuedAt = new Date().toISOString();

  // Centralized console logging
  if (type === 'signup-otp') {
    console.log('\n=== Signup OTP Code ===');
    if (name) console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Code: ${code}`);
    console.log('=======================\n');
  } else {
    console.log('\n=== Login Code ===');
    console.log(`Email: ${email}`);
    console.log(`Code: ${code}`);
    console.log('==================\n');
  }

  // Store for test retrieval (same shape as SSE payload)
  lastPayloads.set(type, {
    email,
    code,
    issuedAt,
    ...(name && { name }),
    ...(token && { token }),
  });

  // SSE broadcast
  const ssePayload = {
    type,
    email,
    code,
    issuedAt,
    ...(name && { name }),
    ...(token && { token }),
  };
  const deadIds: string[] = [];
  for (const [id, controller] of connections) {
    try {
      sendToConnection(controller, type, ssePayload);
    } catch {
      deadIds.push(id);
    }
  }
  for (const id of deadIds) {
    connections.delete(id);
  }
}

/**
 * Get the last emitted OTP for a type (test only). Used by e2e to avoid SSE timing issues.
 */
export function getLastTestOtp(type: TestOtpEventType): {
  email: string;
  code: string;
  issuedAt: string;
  name?: string;
  token?: string;
} | null {
  return lastPayloads.get(type) ?? null;
}
