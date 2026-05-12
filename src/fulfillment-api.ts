import type { PaymentConfig } from './payment-config';
import type { BookItem } from './books-api';

export type FulfillmentResult = {
	fulfilled: boolean;
	accessUrl: string;
	message: string;
};

export async function requestBookFulfillment(args: {
	config: PaymentConfig;
	book: BookItem;
	walletAddress: string;
	digest: string;
}): Promise<FulfillmentResult> {
	const { config, book, walletAddress, digest } = args;

	const baseUrl = config.fulfillmentApiBaseUrl || window.location.origin;
	const url = new URL('/api/verify-purchase', baseUrl);

	try {
		const response = await fetch(url.toString(), {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
			},
			body: JSON.stringify({
				bookId: book.id,
				walletAddress,
				digest,
			}),
		});

		if (!response.ok) {
			const err = await response.json().catch(() => ({}));
			throw new Error(err.error || 'Payment succeeded but fulfillment verification failed.');
		}

		const data = await response.json();

		return {
			fulfilled: data.fulfilled ?? true,
			accessUrl: data.accessUrl || book.accessUrl,
			message: data.message || 'Book access granted.',
		};
	} catch (error: any) {
		console.error('Fulfillment error:', error);
		// Return a generic fallback so the user doesn't lose access completely in MVP
		return {
			fulfilled: false,
			accessUrl: book.accessUrl,
			message: `Warning: ${error.message}`,
		};
	}
}
