import type { SuiClientTypes } from '@mysten/sui/client';
import type { SuiGrpcClient } from '@mysten/sui/grpc';

export function pickCreatedSharedObjectId(effects: SuiClientTypes.TransactionEffects): string | null {
	const sharedCreated = effects.changedObjects.filter(
		(c) => c.idOperation === 'Created' && c.outputOwner?.$kind === 'Shared',
	);
	if (sharedCreated[0]) return sharedCreated[0].objectId;
	const anyCreated = effects.changedObjects.filter((c) => c.idOperation === 'Created');
	return anyCreated[0]?.objectId ?? null;
}

export function parseGreetingTextFromObjectJson(
	json: Record<string, unknown> | null | undefined,
): string | null {
	if (!json) return null;
	const wrap = json as Record<string, unknown>;
	const fields = wrap.fields;
	const source =
		typeof fields === 'object' && fields !== null ? (fields as Record<string, unknown>) : wrap;
	const text = source.text;
	if (typeof text === 'string') return text;
	if (
		text &&
		typeof text === 'object' &&
		'bytes' in text &&
		Array.isArray((text as { bytes: unknown }).bytes)
	) {
		const bytes = (text as { bytes: number[] }).bytes;
		return new TextDecoder().decode(new Uint8Array(bytes));
	}
	return null;
}

export async function fetchGreetingText(client: SuiGrpcClient, objectId: string): Promise<string | null> {
	const { object } = await client.getObject({
		objectId,
		include: { json: true },
	});
	return parseGreetingTextFromObjectJson(object.json ?? null);
}

export type GreetingDisplayState = { text: string | null; error: string | null };

export async function loadGreetingDisplayState(
	client: SuiGrpcClient,
	objectId: string | null,
): Promise<GreetingDisplayState> {
	if (!objectId) {
		return { text: null, error: null };
	}
	try {
		const text = await fetchGreetingText(client, objectId);
		if (text === null) {
			return {
				text: null,
				error: 'Could not read greeting text from chain (unexpected object shape).',
			};
		}
		return { text, error: null };
	} catch (e) {
		return {
			text: null,
			error: e instanceof Error ? e.message : String(e),
		};
	}
}
