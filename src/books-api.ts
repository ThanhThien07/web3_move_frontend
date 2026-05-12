import { type PaymentConfig } from './payment-config';
import { BOOKS_DATA } from './books-data';

export type BookItem = {
	id: string;
	title: string;
	author: string;
	coverUrl: string | null;
	priceMist: bigint;
	accessUrl: string;
};

export async function searchBooks(query: string, config: PaymentConfig): Promise<BookItem[]> {
	const q = query.trim().toLowerCase();
	
	// Simulate API delay
	await new Promise(resolve => setTimeout(resolve, 300));

	const filteredBooks = q 
		? BOOKS_DATA.filter(b => 
				b.title.toLowerCase().includes(q) || 
				b.author.toLowerCase().includes(q)
			)
		: BOOKS_DATA;

	return filteredBooks.map((item) => ({
		id: item.id,
		title: item.title,
		author: item.author,
		coverUrl: item.cover_url,
		priceMist: item.price_mist ? BigInt(item.price_mist) : config.defaultBookPriceMist,
		accessUrl: item.access_url,
	}));
}
