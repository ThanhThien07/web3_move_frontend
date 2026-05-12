export const DEFAULT_SUI_COIN_TYPE = '0x2::sui::SUI';
export const DEFAULT_PAYMENT_TOKEN_NAME = 'SUI';
export const MIST_PER_SUI = 1_000_000_000n;

function readEnv(name: string): string {
	const value = import.meta.env[name]?.trim();
	return value ?? '';
}

function parsePriceToMist(raw: string): bigint {
	if (!raw) return 100_000_000n;
	const normalized = raw.replace(/_/g, '');
	if (!/^\d+(\.\d+)?$/.test(normalized)) {
		throw new Error('VITE_DEFAULT_BOOK_PRICE must be a positive number.');
	}

	const [wholeStr, fracStr = ''] = normalized.split('.');
	const whole = BigInt(wholeStr) * MIST_PER_SUI;
	const fracPadded = `${fracStr}000000000`.slice(0, 9);
	const frac = BigInt(fracPadded);
	return whole + frac;
}

export type PaymentConfig = {
	receiver: string; // Keep for backward compatibility or admin withdrawals
	packageId: string;
	libraryId: string;
	coinType: string;
	tokenName: string;
	defaultBookPriceMist: bigint;
	booksApiBaseUrl: string;
	fulfillmentApiBaseUrl: string;
};

export function getPaymentConfig(): PaymentConfig {
	const receiver = readEnv('VITE_PAYMENT_RECEIVER') || '0x0';
	
	// Default to placeholders if not set in .env
	const packageId = readEnv('VITE_PACKAGE_ID') || '0x_PLACEHOLDER_PACKAGE_ID';
	const libraryId = readEnv('VITE_LIBRARY_OBJECT_ID') || '0x_PLACEHOLDER_LIBRARY_ID';

	const coinType = readEnv('VITE_PAYMENT_COIN_TYPE') || DEFAULT_SUI_COIN_TYPE;
	const tokenName = readEnv('VITE_PAYMENT_TOKEN_NAME') || DEFAULT_PAYMENT_TOKEN_NAME;

	return {
		receiver,
		packageId,
		libraryId,
		coinType,
		tokenName,
		defaultBookPriceMist: parsePriceToMist(readEnv('VITE_DEFAULT_BOOK_PRICE')),
		booksApiBaseUrl: readEnv('VITE_BOOKS_API_BASE_URL') || 'http://localhost:3002',
		fulfillmentApiBaseUrl: readEnv('VITE_FULFILLMENT_API_BASE_URL') || 'http://localhost:3001',
	};
}
