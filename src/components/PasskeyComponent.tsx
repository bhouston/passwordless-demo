import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldSet } from "@/components/ui/field";
import { startPasskeyRegistration } from "@/lib/webauthnClient";
import {
	deletePasskey,
	generateRegistrationOptions,
	verifyRegistrationResponse,
} from "@/server/passkey";

interface PasskeyComponentProps {
	userId: number;
	hasPasskey: boolean;
	userName: string;
	userDisplayName: string;
}

export function PasskeyComponent({
	userId,
	hasPasskey,
	userName,
	userDisplayName,
}: PasskeyComponentProps) {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const generateRegistrationOptionsFn = useServerFn(
		generateRegistrationOptions,
	);
	const verifyRegistrationResponseFn = useServerFn(verifyRegistrationResponse);
	const deletePasskeyFn = useServerFn(deletePasskey);

	// Mutation for adding a passkey
	const addPasskeyMutation = useMutation({
		mutationFn: async () => {
			// Generate registration options from server
			const result = await generateRegistrationOptionsFn({
				data: {
					userId,
					userName,
					userDisplayName,
				},
			});

			if (!result.options || !result.token) {
				throw new Error("Failed to generate registration options");
			}

			// Start registration on client
			const registrationResponse = await startPasskeyRegistration({
				optionsJSON: result.options,
			});

			// Verify registration on server
			const verification = await verifyRegistrationResponseFn({
				data: {
					response: registrationResponse,
					userId,
					token: result.token,
				},
			});

			if (!verification.success) {
				throw new Error(verification.error || "Failed to register passkey");
			}

			return verification;
		},
		onSuccess: () => {
			setSuccessMessage("Passkey registered successfully!");
			setError(null);
			// Invalidate router to refresh data
			router.invalidate();
		},
		onError: (err) => {
			if (err instanceof Error) {
				// Handle user cancellation gracefully
				if (
					err.message.includes("cancelled") ||
					err.message.includes("abort") ||
					err.message.includes("NotAllowedError")
				) {
					setError("Registration cancelled");
				} else if (err.message.includes("NotSupportedError")) {
					setError("Passkeys are not supported on this device or browser");
				} else {
					setError(err.message || "Failed to register passkey");
				}
			} else {
				setError("Failed to register passkey. Please try again.");
			}
			setSuccessMessage(null);
		},
	});

	// Mutation for deleting a passkey
	const deletePasskeyMutation = useMutation({
		mutationFn: async () => {
			return await deletePasskeyFn({ data: { userId } });
		},
		onSuccess: () => {
			setSuccessMessage("Passkey deleted successfully!");
			setError(null);
			// Invalidate router to refresh data
			router.invalidate();
		},
		onError: (err) => {
			setError(
				err instanceof Error
					? err.message
					: "Failed to delete passkey. Please try again.",
			);
			setSuccessMessage(null);
		},
	});

	const handleAddPasskey = () => {
		setError(null);
		setSuccessMessage(null);
		addPasskeyMutation.mutate();
	};

	const handleDeletePasskey = () => {
		if (
			!confirm(
				"Are you sure you want to delete your passkey? You will need to register a new one to use passkey login.",
			)
		) {
			return;
		}

		setError(null);
		setSuccessMessage(null);
		deletePasskeyMutation.mutate();
	};

	const isLoading =
		addPasskeyMutation.isPending || deletePasskeyMutation.isPending;

	return (
		<div className="border border-border bg-card p-6">
			<div className="mb-6">
				<h2 className="mb-2 text-2xl font-semibold text-foreground">
					Passkey Management
				</h2>
				<p className="text-sm text-muted-foreground">
					Manage your passkey for secure, passwordless authentication
				</p>
			</div>

			<FieldSet>
				<FieldGroup>
					<div className="mb-4">
						<div className="border border-border bg-muted/50 p-4">
							<p className="text-sm text-foreground">
								<strong>Status:</strong>{" "}
								{hasPasskey ? (
									<span className="text-green-700">Passkey registered</span>
								) : (
									<span className="text-amber-800">No passkey registered</span>
								)}
							</p>
							{hasPasskey && (
								<p className="mt-2 text-xs text-muted-foreground">
									You can use your passkey to login securely without a password.
								</p>
							)}
						</div>
					</div>

					{error && <FieldError className="mb-4">{error}</FieldError>}

					{successMessage && (
						<div className="mb-4 border border-green-200 bg-green-50 p-4">
							<p className="text-sm text-green-800">{successMessage}</p>
						</div>
					)}

					<Field>
						{hasPasskey ? (
							<Button
								onClick={handleDeletePasskey}
								disabled={isLoading}
								variant="destructive"
							>
								{deletePasskeyMutation.isPending
									? "Deleting..."
									: "Delete Passkey"}
							</Button>
						) : (
							<Button onClick={handleAddPasskey} disabled={isLoading}>
								{addPasskeyMutation.isPending
									? "Registering..."
									: "Add Passkey"}
							</Button>
						)}
					</Field>
				</FieldGroup>
			</FieldSet>
		</div>
	);
}
