import { createFileRoute } from '@tanstack/react-router';
import { getLastTestOtp, isTestOtpSseEnabled } from '@/server/testOtpSse';
import type { TestOtpEventType } from '@/server/testOtpSse';

export const Route = createFileRoute('/test-otp-latest')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isTestOtpSseEnabled()) {
          return new Response(null, { status: 401 });
        }
        const url = new URL(request.url);
        const type = url.searchParams.get('type') as TestOtpEventType | null;
        if (type !== 'signup-otp' && type !== 'login-otp') {
          return new Response(JSON.stringify({ error: 'Missing or invalid type (signup-otp | login-otp)' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        const payload = getLastTestOtp(type);
        return new Response(JSON.stringify(payload ?? {}), {
          headers: { 'Content-Type': 'application/json' },
        });
      },
    },
  },
});
