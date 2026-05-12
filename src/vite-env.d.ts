/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_PACKAGE_ID?: string;
	readonly VITE_GREETING_OBJECT_ID?: string;
	readonly VITE_PAYMENT_RECEIVER?: string;
	readonly VITE_PAYMENT_COIN_TYPE?: string;
	readonly VITE_PAYMENT_TOKEN_NAME?: string;
	readonly VITE_DEFAULT_BOOK_PRICE?: string;
	readonly VITE_BOOKS_API_BASE_URL?: string;
	readonly VITE_FULFILLMENT_API_BASE_URL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
