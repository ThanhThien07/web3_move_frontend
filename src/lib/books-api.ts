import { getPaymentConfig } from './payment-config';

export interface BookItem {
	id: string;
	title: string;
	author: string;
	coverUrl: string;
	priceMist: bigint;
	owner_wallet: string;
}

// Premium Demo Data (fallback if server is offline)
const MOCK_BOOKS: BookItem[] = [
	{
		id: 'mock-1',
		title: 'Sui Move Fundamentals',
		author: 'Sui Foundation',
		coverUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=400&q=80',
		priceMist: 100000000n,
		owner_wallet: 'Admin'
	},
	{
		id: 'mock-2',
		title: 'Web3 Design Patterns',
		author: 'Design Master',
		coverUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=400&q=80',
		priceMist: 200000000n,
		owner_wallet: 'Admin'
	},
	{
		id: 'mock-3',
		title: 'Blockchain Security Essentials',
		author: 'Security Pro',
		coverUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=400&q=80',
		priceMist: 350000000n,
		owner_wallet: 'Admin'
	},
	{
		id: 'mock-4',
		title: 'The Future of DeFi 2.0',
		author: 'Yield Nerd',
		coverUrl: 'https://images.unsplash.com/photo-1614332287897-cdc485fa562d?auto=format&fit=crop&w=400&q=80',
		priceMist: 150000000n,
		owner_wallet: 'Admin'
	}
];

export async function searchBooks(query: string = ''): Promise<BookItem[]> {
	const config = getPaymentConfig();
	
	// If the URL contains "localhost" and we are in production, skip and use MOCK
	const isProd = import.meta.env.PROD;
	const isLocalUrl = config.booksApiBaseUrl.includes('localhost') || config.booksApiBaseUrl.includes('127.0.0.1');

	if (isProd && isLocalUrl) {
		console.warn('Production detected but API URL is localhost. Falling back to Demo Mode.');
		return filterBooks(MOCK_BOOKS, query);
	}

	try {
		const res = await fetch(`${config.booksApiBaseUrl}/api/books`, {
			// @ts-ignore
			signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined
		});
		
		if (!res.ok) throw new Error('Backend server is not responding');
		
		const data = await res.json();
		const items = Array.isArray(data) ? data : (data.items || []);

		const mapped = items.map((item: any) => ({
			id: item.id || `live-${Math.random()}`,
			title: item.title || 'Untitled Book',
			author: item.author || 'Anonymous',
			coverUrl: item.cover_url || '',
			priceMist: item.price_mist ? BigInt(item.price_mist) : config.defaultBookPriceMist,
			owner_wallet: item.owner_wallet || 'Admin'
		}));

		return filterBooks(mapped, query);
	} catch (err) {
		console.warn('Backend connection failed, using premium mock data.');
		return filterBooks(MOCK_BOOKS, query);
	}
}

function filterBooks(books: BookItem[], query: string): BookItem[] {
	if (!query) return books;
	return books.filter((b: BookItem) => 
		b.title.toLowerCase().includes(query.toLowerCase()) || 
		b.author.toLowerCase().includes(query.toLowerCase())
	);
}
