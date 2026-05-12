export const GREETING_OBJECT_STORAGE_KEY = 'web3_move_frontend.greetingObjectId';

/** Env overrides localStorage; localStorage is set after a successful `new` call. */
export function getConfiguredGreetingObjectId(): string | null {
	const fromEnv = import.meta.env.VITE_GREETING_OBJECT_ID?.trim();
	if (fromEnv) return fromEnv;
	return localStorage.getItem(GREETING_OBJECT_STORAGE_KEY);
}

export function persistGreetingObjectId(objectId: string) {
	localStorage.setItem(GREETING_OBJECT_STORAGE_KEY, objectId);
}

export function clearPersistedGreetingObjectId() {
	localStorage.removeItem(GREETING_OBJECT_STORAGE_KEY);
}
