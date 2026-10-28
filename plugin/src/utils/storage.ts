import { createJSONStorage } from "jotai/utils";

type StringStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/**
 * The `SyncStorage` shape `atomWithStorage` expects. Declared here because
 * jotai only re-exports its storage factories, not the matching types.
 */
interface JSONStorage<Value> {
	getItem: (key: string, initialValue: Value) => Value;
	setItem: (key: string, newValue: Value) => void;
	removeItem: (key: string) => void;
	subscribe?: (
		key: string,
		callback: (value: Value) => void,
		initialValue: Value
	) => () => void;
}

const PROBE_KEY = "__starknet_remix_storage_probe__";

const createMemoryStorage = (): StringStorage => {
	const entries = new Map<string, string>();
	return {
		getItem: (key: string): string | null => entries.get(key) ?? null,
		setItem: (key: string, value: string): void => {
			entries.set(key, value);
		},
		removeItem: (key: string): void => {
			entries.delete(key);
		}
	};
};

const memoryStorage = createMemoryStorage();

/**
 * Remix hosts the plugin in a cross-origin iframe, and browsers that block
 * third-party storage throw on every `window.localStorage` access instead of
 * returning an empty store. Probe once with a write/erase round trip so that
 * disabled and read-only storage are both detected.
 */
const isLocalStorageAvailable = ((): boolean => {
	try {
		window.localStorage.setItem(PROBE_KEY, PROBE_KEY);
		window.localStorage.removeItem(PROBE_KEY);
		return true;
	} catch {
		return false;
	}
})();

if (!isLocalStorageAvailable) {
	console.warn(
		"localStorage is unavailable, most likely blocked for cross-origin iframes. Falling back to in-memory storage: compiled contracts and accounts will not be kept across reloads."
	);
}

/**
 * Returns the real `localStorage` whenever it works, so that jotai keeps
 * syncing atoms across tabs through its `storage` event subscription, which it
 * only installs for a genuine `Storage` instance.
 */
const getStringStorage = (): StringStorage =>
	isLocalStorageAvailable ? window.localStorage : memoryStorage;

/**
 * Wraps a jotai JSON storage so that a storage failure, such as exceeding the
 * quota while persisting a large contract, degrades to a missing entry instead
 * of propagating out of a render or an event handler.
 */
const createSafeJSONStorage = <Value>(): JSONStorage<Value> => {
	const jsonStorage = createJSONStorage<Value>(getStringStorage);

	return {
		...jsonStorage,
		getItem: (key: string, initialValue: Value): Value => {
			try {
				return jsonStorage.getItem(key, initialValue);
			} catch {
				return initialValue;
			}
		},
		setItem: (key: string, newValue: Value): void => {
			try {
				jsonStorage.setItem(key, newValue);
			} catch {
				console.warn(`Could not persist "${key}" to storage.`);
			}
		},
		removeItem: (key: string): void => {
			try {
				jsonStorage.removeItem(key);
			} catch {
				console.warn(`Could not remove "${key}" from storage.`);
			}
		}
	};
};

const storage = {
	get: (key: string): string | undefined => {
		let item: string | null = null;
		try {
			item = getStringStorage().getItem(key);
		} catch {
			return undefined;
		}
		if (item === null) return undefined;
		try {
			return JSON.parse(item);
		} catch {
			return undefined;
		}
	},
	set: (key: string, value: any): void => {
		try {
			getStringStorage().setItem(key, JSON.stringify(value));
		} catch {
			console.warn(`Could not persist "${key}" to storage.`);
		}
	},
	remove: (key: string): void => {
		try {
			getStringStorage().removeItem(key);
		} catch {
			console.warn(`Could not remove "${key}" from storage.`);
		}
	}
};

export default storage;
export { createSafeJSONStorage };
