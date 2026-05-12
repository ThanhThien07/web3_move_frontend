import { type PaymentConfig } from './payment-config';

export type BookItem = {
	id: string;
	title: string;
	author: string;
	coverUrl: string | null;
	priceMist: bigint;
	owner_wallet: string;
};

export async function searchBooks(query: string, config: PaymentConfig): Promise<BookItem[]> {
	try {
		const res = await fetch(`${config.booksApiBaseUrl}/api/books`);
		const books = await res.json();
		
		const q = query.trim().toLowerCase();
		const filtered = q 
			? books.filter((b: any) => 
					b.title.toLowerCase().includes(q) || 
					b.author.toLowerCase().includes(q)
				)
			: books;

		return filtered.map((item: any) => ({
			id: item.id,
			title: item.title,
			author: item.author,
			coverUrl: item.cover_url,
			priceMist: item.price_mist ? BigInt(item.price_mist) : config.defaultBookPriceMist,
			owner_wallet: item.owner_wallet || 'Admin'
		}));
	} catch (err) {
		console.error('Failed to fetch books from API, falling back to empty list');
		return [];
	}
}
