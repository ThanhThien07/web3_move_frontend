import { useState, useEffect } from 'react';
import { Loader2, Sparkles, AlertCircle, BookOpen, ShoppingCart, Heart } from 'lucide-react';
import { searchBooks, type BookItem } from '../lib/books-api';
import { getPaymentConfig, MIST_PER_SUI } from '../lib/payment-config';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface LibraryGridProps {
  onSelectBook?: (book: BookItem) => void;
}

export default function LibraryGrid({ onSelectBook }: LibraryGridProps) {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const paymentConfig = getPaymentConfig();

  const toggleFav = async (e: React.MouseEvent, bookId: string) => {
    e.stopPropagation();
    if (!user) return toast.error('Vui lòng đăng nhập để yêu thích');

    try {
      const res = await fetch(`${paymentConfig.booksApiBaseUrl}/api/favorites/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, bookId })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        login({ ...user, favorites: data.favorites });
      }
    } catch (err) {
      toast.error('Không thể kết nối máy chủ');
    }
  };

  const isFav = (bookId: string) => user?.favorites?.includes(bookId);

  useEffect(() => {
    handleSearch();
  }, []);

  async function handleSearch() {
    setLoading(true);
    setError(null);
    try {
      const result = await searchBooks('', paymentConfig);
      setBooks(result);
      if (result.length === 0) setError('Không tìm thấy sách nào.');
    } catch (err) {
      setError('Lỗi khi tải dữ liệu sách. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }

  function formatPrice(mist: bigint) {
    const sui = Number(mist) / Number(MIST_PER_SUI);
    return sui.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 });
  }

  return (
    <div className="space-y-8 md:space-y-12 px-4 sm:px-6 lg:px-8">
      {/* Banner Section */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 mt-6">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80" 
            alt="Library Banner" 
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent"></div>
        </div>
        <div className="relative z-10 px-6 py-10 md:px-12 md:py-20 max-w-2xl">
          <h2 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4">
            Tri thức là sức mạnh. <br/>
            <span className="text-[#10b981]">Sở hữu vĩnh viễn</span> trên Web3.
          </h2>
          <p className="text-slate-300 text-lg mb-8">
            Khám phá bộ sưu tập sách điện tử chọn lọc. Giao dịch an toàn, minh bạch và nhận sách ngay lập tức thông qua mạng lưới Sui.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="bg-[#10b981] hover:bg-[#059669] text-white px-6 py-3 rounded-xl font-bold transition-colors">
              Khám phá ngay
            </button>
            <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold backdrop-blur-sm transition-colors border border-white/10">
              Tìm hiểu thêm
            </button>
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="relative">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-[#10b981] animate-spin" />
            <p className="text-slate-500 font-medium">Đang tìm sách...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <AlertCircle className="w-12 h-12 text-rose-500" />
            <p className="text-rose-600 font-medium max-w-xs">{error}</p>
            <button onClick={() => handleSearch()} className="text-[#10b981] hover:underline text-sm font-bold">Thử lại</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {books.map((book) => (
              <div 
                key={book.id} 
                onClick={() => {
                  if (onSelectBook) onSelectBook(book);
                  navigate(`/checkout/${book.id}`);
                }}
                className="group book-card flex flex-col h-full cursor-pointer relative"
              >
                <div className="relative aspect-[3/4] bg-slate-100 overflow-hidden">
                  {book.coverUrl ? (
                    <img 
                      src={book.coverUrl} 
                      alt={book.title}
                      className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-slate-300" />
                    </div>
                  )}
                  
                  {/* Favorite Button */}
                  <button 
                    onClick={(e) => toggleFav(e, book.id)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 hover:bg-white transition-all z-10"
                  >
                    <Heart className={`w-4 h-4 ${isFav(book.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                  </button>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button className="bg-white text-slate-800 font-bold py-2 px-4 rounded-full text-sm shadow-lg flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      <Sparkles className="w-4 h-4 text-[#10b981]" /> Mua ngay
                    </button>
                  </div>
                </div>

                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="text-slate-800 font-bold text-sm line-clamp-2 mb-1 group-hover:text-[#10b981] transition-colors">{book.title}</h3>
                  <p className="text-slate-500 text-xs mb-3">{book.author}</p>
                  
                  <div className="mt-auto flex items-center justify-between">
                    <span className="price-text">
                      {formatPrice(book.priceMist)} <span className="text-xs text-slate-500 font-normal ml-1">SUI</span>
                    </span>
                    <button className="w-8 h-8 rounded-full bg-[#10b981]/10 text-[#10b981] flex items-center justify-center group-hover:bg-[#10b981] group-hover:text-white transition-colors">
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
