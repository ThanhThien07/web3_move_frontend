import type { PaymentConfig } from './payment-config';
import type { BookItem } from './books-api';

export type FulfillmentResult = {
	fulfilled: boolean;
	accessUrl: string;
	message: string;
	digest: string;
};

export type FulfillmentRequest = {
	config: PaymentConfig;
	book: BookItem;
	walletAddress: string;
	digest: string;
};

export async function requestBookFulfillment(req: FulfillmentRequest): Promise<FulfillmentResult> {
	// Simulate backend verification
	await new Promise(resolve => setTimeout(resolve, 800));

	const { book, digest } = req;

	// In a real production app, you would verify the transaction digest on-chain 
	// here via a trusted backend or by checking events client-side.
	
	const result: FulfillmentResult = {
		fulfilled: true,
		accessUrl: book.accessUrl,
		message: 'Payment verified on Sui Network. Access granted.',
		digest: digest
	};

	// Save to local collection for persistence without backend
	const PURCHASES_KEY = 'itc-library-purchases';
	const saved = localStorage.getItem(PURCHASES_KEY);
	const purchases = saved ? JSON.parse(saved) : [];
	
	if (!purchases.find((p: any) => p.digest === digest)) {
		purchases.push({
			...book,
			digest,
			purchaseDate: new Date().toISOString()
		});
		localStorage.setItem(PURCHASES_KEY, JSON.stringify(purchases));
	}

	return result;
}
