import { createFileRoute } from "@tanstack/react-router";
import {
	isTestOtpSseEnabled,
	registerTestOtpConnection,
	unregisterTestOtpConnection,
} from "@/server/testOtpSse";

export const Route = createFileRoute("/test-otp-events")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				if (!isTestOtpSseEnabled()) {
					return new Response(null, { status: 401 });
				}

				const connectionId = crypto.randomUUID();

				const stream = new ReadableStream<Uint8Array>({
					start(controller) {
						registerTestOtpConnection(connectionId, controller);

						// Send initial connected event for test synchronization
						const eventLine = "event: connected\n";
						const dataLine = `data: ${JSON.stringify({ connectionId })}\n\n`;
						controller.enqueue(
							new TextEncoder().encode(eventLine + dataLine),
						);

						request.signal?.addEventListener("abort", () => {
							unregisterTestOtpConnection(connectionId);
						});
					},
				});

				return new Response(stream, {
					headers: {
						"Cache-Control": "no-cache",
						Connection: "keep-alive",
						"Content-Type": "text/event-stream",
						"X-Accel-Buffering": "no",
					},
				});
			},
		},
	},
});
