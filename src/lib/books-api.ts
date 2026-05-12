import { type PaymentConfig } from './payment-config';

export type BookItem = {
	id: string;
	title: string;
	author: string;
	coverUrl: string | null;
	priceMist: bigint;
	accessUrl: string;
};

export async function searchBooks(query: string, config: PaymentConfig): Promise<BookItem[]> {
	const q = query.trim();
	
	const baseUrl = config.booksApiBaseUrl || window.location.origin;
	const url = new URL('/api/books', baseUrl);
	if (q) {
		url.searchParams.set('q', q);
	}

	try {
		const response = await fetch(url.toString());
		if (!response.ok) {
			throw new Error('Failed to fetch books from backend');
		}

		const data = await response.json();
		
		if (!data.items || data.items.length === 0) {
			return [];
		}

		return data.items.map((item: any) => ({
			id: item.id,
			title: item.title,
			author: item.author,
			coverUrl: item.cover_url,
			priceMist: item.price_mist ? BigInt(item.price_mist) : config.defaultBookPriceMist,
			accessUrl: item.access_url,
		}));
	} catch (error) {
		console.error('Error fetching books:', error);
		return [];
	}
}
