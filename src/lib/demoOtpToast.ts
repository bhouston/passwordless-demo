import { toast } from 'sonner';

export type DemoOtpType = 'signup-otp' | 'login-otp';

/**
 * Fetches the last OTP from the dev/test-only `/test-otp-latest` route and shows it in a Sonner toast.
 * No-ops when the endpoint is disabled (e.g. production returns 401).
 */
export async function showLastOtpToast(type: DemoOtpType): Promise<void> {
  const res = await fetch(`/test-otp-latest?type=${type}`);
  if (!res.ok) {
    return;
  }
  const data = (await res.json()) as { code?: string };
  if (!data.code) {
    return;
  }
  toast.success('Demo: your code', {
    description: data.code,
    duration: 10_000,
  });
}
