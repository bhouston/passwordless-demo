import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/button';
import { useSessionUser } from '@/hooks/useSessionUser';
import { useToastMutation } from '@/hooks/useToastMutation';
import { logout } from '@/server/auth';
import { getUserWithPasskey } from '@/server/user';

export const Route = createFileRoute('/logout')({
  beforeLoad: async ({ location }) => {
    try {
      await getUserWithPasskey({});
    } catch {
      const redirectTo = `${location.pathname}${location.search}`;
      throw redirect({
        to: '/login',
        search: { redirectTo },
      });
    }
  },
  component: LogoutPage,
});

function LogoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { sessionUser } = useSessionUser();
  const logoutFn = useServerFn(logout);

  const logoutMutation = useToastMutation({
    action: 'Logout',
    toastSuccess: false, // Don't show toast, we'll redirect immediately
    mutationFn: async () => {
      await logoutFn({});
    },
    onSuccess: async () => {
      await queryClient.clear();
      await router.navigate({ to: '/login' });
    },
  });

  return (
    <AuthLayout title="Logout">
      <div className="space-y-4">
        {sessionUser && (
          <p className="text-center text-muted-foreground">
            You are currently logged in as{' '}
            <span className="font-semibold text-foreground">{sessionUser.name || sessionUser.email}</span>
          </p>
        )}
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="w-full"
            variant="destructive"
          >
            {logoutMutation.isPending ? 'Logging out...' : 'Log Out'}
          </Button>
          <Button onClick={() => router.navigate({ to: '/user-settings' })} className="w-full" variant="outline">
            Cancel
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
