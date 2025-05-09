import "vite/client";

interface ImportMetaEnv {
	readonly VITE_URL: string;
	readonly VITE_API_URL: string;
	readonly VITE_DEVNET_URL: string;
	readonly VITE_REMOTE_DEVNET_URL: string;
	readonly VITE_VERSION: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
