import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { type BookItem } from '../lib/books-api';
import LibraryGrid from '../components/LibraryGrid';
import { Heart, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getPaymentConfig } from '../lib/payment-config';

export default function Favorites() {
  const { user } = useAuth();
  const [favoriteBooks, setFavoriteBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFavorites() {
      if (!user) return;
      try {
        const config = getPaymentConfig();
        const res = await fetch(`${config.booksApiBaseUrl}/api/favorites?username=${user.username}`);
        const data = await res.json();
        if (res.ok) {
          // Map backend book to frontend BookItem
          const mapped = data.map((b: any) => ({
            id: b.id,
            title: b.title,
            author: b.author,
            coverUrl: b.cover_url,
            priceMist: BigInt(b.price_mist),
            accessUrl: b.access_url
          }));
          setFavoriteBooks(mapped);
        }
      } catch (err) {
        console.error('Lỗi tải danh sách yêu thích');
      } finally {
        setLoading(false);
      }
    }
    fetchFavorites();
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
          <Heart className="w-10 h-10 text-slate-300" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Vui lòng đăng nhập</h2>
        <p className="text-slate-500 max-w-md">Bạn cần đăng nhập để xem danh sách sách yêu thích của mình.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pt-6 px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
          <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-800">Sách yêu thích</h1>
          <p className="text-slate-500">Những cuốn sách bạn đã lưu lại để mua sau này.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500">Đang tải...</div>
      ) : favoriteBooks.length === 0 ? (
        <div className="bg-white rounded-3xl p-20 border border-slate-100 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8 text-slate-200" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Danh sách trống</h3>
          <p className="text-slate-500">Hãy quay lại trang chủ và chọn những cuốn sách bạn yêu thích nhé.</p>
          <Link to="/" className="primary-button inline-flex">Khám phá ngay</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {/* Reuse the rendering logic from LibraryGrid by passing the filtered list or just custom rendering */}
          {/* For simplicity, I'll provide a separate render or we could've exported BookCard component */}
          {favoriteBooks.map((book) => (
             <Link to={`/checkout/${book.id}`} key={book.id} className="group book-card flex flex-col h-full cursor-pointer relative">
                <div className="relative aspect-[3/4] bg-slate-100 overflow-hidden">
                  <img src={book.coverUrl} className="w-full h-full object-cover" alt={book.title} />
                  <div className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200">
                    <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="text-slate-800 font-bold text-sm line-clamp-2 mb-1 group-hover:text-[#10b981] transition-colors">{book.title}</h3>
                  <p className="text-slate-500 text-xs mb-3">{book.author}</p>
                  <div className="mt-auto">
                    <span className="price-text">{Number(book.priceMist) / 1000000000} SUI</span>
                  </div>
                </div>
             </Link>
          ))}
        </div>
      )}
    </div>
  );
}
