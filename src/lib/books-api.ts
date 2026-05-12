import { getPaymentConfig } from './payment-config';
import localBooks from '../data/books.json';

export interface BookItem {
	id: string;
	title: string;
	author: string;
	coverUrl: string;
	priceMist: bigint;
	owner_wallet: string;
}

export async function searchBooks(query: string = ''): Promise<BookItem[]> {
	const config = getPaymentConfig();
	
	// Khởi tạo với dữ liệu local từ Frontend
	let finalBooks: BookItem[] = localBooks.map((item: any) => ({
		id: item.id,
		title: item.title,
		author: item.author,
		coverUrl: item.coverUrl,
		priceMist: BigInt(item.priceMist),
		owner_wallet: item.owner_wallet || 'Admin'
	}));

	try {
		// Thử lấy dữ liệu mới nhất từ Admin server (nếu có)
		const res = await fetch(`${config.booksApiBaseUrl}/api/books`, {
			// @ts-ignore
			signal: AbortSignal.timeout ? AbortSignal.timeout(2000) : undefined
		});
		
		if (res.ok) {
			const data = await res.json();
			const serverItems = Array.isArray(data) ? data : (data.items || []);

			if (serverItems.length > 0) {
				const mappedServer = serverItems.map((item: any) => ({
					id: item.id || `live-${Math.random()}`,
					title: item.title || 'Untitled Book',
					author: item.author || 'Anonymous',
					coverUrl: item.cover_url || '',
					priceMist: item.price_mist ? BigInt(item.price_mist) : config.defaultBookPriceMist,
					owner_wallet: item.owner_wallet || 'Admin'
				}));
				
				// Ưu tiên dữ liệu từ Server vì đây là dữ liệu mới nhất
				finalBooks = mappedServer;
			}
		}
	} catch (err) {
		console.warn('Admin server offline, using local frontend data.');
	}

	// Lọc theo từ khóa tìm kiếm (nếu có)
	if (query) {
		return finalBooks.filter((b: BookItem) => 
			b.title.toLowerCase().includes(query.toLowerCase()) || 
			b.author.toLowerCase().includes(query.toLowerCase())
		);
	}
	
	return finalBooks;
}
