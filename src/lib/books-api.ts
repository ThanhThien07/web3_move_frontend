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

// 🚀 ĐỔI TÊN THÀNH fetchBooks ĐỂ PHÙ HỢP VỚI FRONTEND
export async function fetchBooks(): Promise<BookItem[]> {
	const config = getPaymentConfig();
	
	// Khởi tạo với dữ liệu local từ Frontend (đảm bảo web luôn có nội dung hiện ra ngay)
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
		const res = await fetch(`${config.booksApiBaseUrl}/api/books`);
		
		if (res.ok) {
			const data = await res.json();
			const serverItems = Array.isArray(data) ? data : (data.items || []);

			if (serverItems.length > 0) {
				const mappedServer = serverItems.map((item: any) => ({
					id: item.id,
					title: item.title,
					author: item.author,
					coverUrl: item.cover_url || item.coverUrl,
					priceMist: BigInt(item.price_mist || item.priceMist),
					owner_wallet: item.owner_wallet || 'Admin'
				}));
				
				// Ưu tiên dữ liệu từ Server vì đây là dữ liệu mới nhất từ Admin
				finalBooks = mappedServer;
			}
		}
	} catch (err) {
		console.warn('Admin server offline or sync pending, using local data.');
	}
	
	return finalBooks;
}

// Giữ lại searchBooks như một wrapper nếu cần
export async function searchBooks(query: string = ''): Promise<BookItem[]> {
	const books = await fetchBooks();
	if (!query) return books;
	return books.filter((b: BookItem) => 
		b.title.toLowerCase().includes(query.toLowerCase()) || 
		b.author.toLowerCase().includes(query.toLowerCase())
	);
}
