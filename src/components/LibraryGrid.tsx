import { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  MessageCircle, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Loader2, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { type BookItem, fetchBooks } from '../lib/books-api';
import { MIST_PER_SUI } from '../lib/payment-config';

export default function LibraryGrid() {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 10; // 🚀 Tăng số lượng sách mỗi trang lên 10 vì thẻ nhỏ hơn
  
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user } = useAuth();

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBooks();
      setBooks(data);
    } catch (err: any) {
      setError(t('fetchError') || 'Không thể tải danh sách sách.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (mist: any) => (Number(mist || 0) / Number(MIST_PER_SUI)).toFixed(2);

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(search.toLowerCase()) || 
    b.author.toLowerCase().includes(search.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);
  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const currentBooks = filteredBooks.slice(indexOfFirstBook, indexOfLastBook);

  return (
    <div className="space-y-8 pb-16">
      {/* 🚀 BANNER THU GỌN - TINH TẾ HƠN */}
      <div className="relative rounded-[2rem] overflow-hidden bg-slate-900 group h-[300px] md:h-[380px]">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=2000&q=80" 
            alt="Library Banner" 
            className="w-full h-full object-cover opacity-40 mix-blend-overlay group-hover:scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-linear-to-r from-slate-900 via-slate-900/60 to-transparent"></div>
        </div>
        <div className="relative z-10 px-8 py-10 md:px-12 md:py-16 max-w-2xl h-full flex flex-col justify-center">
          <h2 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4 animate-in slide-in-from-left duration-700">
            {t('discover')} <span className="text-brand-primary">{t('ownForever')}</span>
          </h2>
          <p className="text-slate-300 text-base mb-8 animate-in slide-in-from-left delay-100 duration-700 font-medium max-w-md">
            Khám phá bộ sưu tập sách kỹ thuật số an toàn, minh bạch trên Sui.
          </p>
          <div className="flex gap-4 animate-in slide-in-from-left delay-200 duration-700">
            <button className="bg-brand-primary hover:bg-brand-secondary text-white px-6 py-3 rounded-xl font-black transition-all shadow-xl shadow-brand-primary/20 active:scale-95 text-sm">
              {t('exploreNow')}
            </button>
            <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-black backdrop-blur-md transition-all border border-white/10 active:scale-95 text-sm">
              {t('learnMore')}
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar - Thu nhỏ padding */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative grow max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder={t('searchPlaceholder')}
            className="w-full bg-white border border-slate-100 rounded-2xl py-3.5 pl-11 pr-5 text-xs font-bold focus:ring-4 focus:ring-brand-primary/10 transition-all shadow-sm outline-none"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      {/* Books Grid - 5 CỘT TRÊN MÀN HÌNH LỚN ĐỂ THẺ NHỎ LẠI */}
      <div className="relative min-h-[300px]">
        {loading && books.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">{t('searching')}</p>
          </div>
        ) : error && books.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-rose-50 rounded-[2rem] border border-rose-100">
            <AlertCircle className="w-12 h-12 text-rose-500" />
            <p className="text-rose-600 font-black max-w-xs text-sm">{error}</p>
            <button onClick={handleSearch} className="bg-white text-rose-600 px-6 py-2.5 rounded-lg shadow-md font-black hover:bg-rose-500 hover:text-white transition-all text-xs">{t('retry')}</button>
          </div>
        ) : (
          <div className="animate-in fade-in duration-1000">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {currentBooks.map((book) => (
                <div 
                  key={book.id}
                  onClick={() => navigate(`/checkout/${book.id}`)}
                  className="group book-card flex flex-col h-full cursor-pointer relative bg-white rounded-[1.8rem] border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-500"
                >
                  <div className="relative aspect-[3/4.2] bg-slate-50 overflow-hidden">
                    <img 
                      src={book.coverUrl} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      alt={book.title}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="bg-white text-slate-800 font-black py-2 px-4 rounded-xl text-[10px] shadow-xl flex items-center gap-1.5 transform translate-y-3 group-hover:translate-y-0 transition-all duration-500">
                        <Sparkles className="w-3 h-3 text-brand-primary" /> {t('buyNow')}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    {/* 🚀 CỐ ĐỊNH CHIỀU CAO TIÊU ĐỀ (2 DÒNG) */}
                    <div className="h-9 mb-1.5 overflow-hidden">
                      <h3 className="text-slate-900 font-black text-xs line-clamp-2 group-hover:text-brand-primary transition-colors leading-tight">
                        {book.title}
                      </h3>
                    </div>

                    {/* 🚀 CỐ ĐỊNH CHIỀU CAO TÁC GIẢ & CHAT */}
                    <div className="flex items-center justify-between mb-4 h-4">
                      <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider truncate mr-2">
                        {book.author}
                      </p>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!user) return toast.error(t('loginToChat'));
                          (window as any).openChat?.();
                        }}
                        className="flex items-center gap-1 text-brand-primary hover:text-brand-secondary transition-colors shrink-0"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span className="text-[8px] font-black uppercase tracking-widest">{t('chat')}</span>
                      </button>
                    </div>

                    {/* 🚀 ĐẨY PHẦN NÀY XUỐNG ĐÁY ĐỂ LUÔN ĐỀU NHAU */}
                    <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                          {t('price')}
                        </span>
                        <span className="text-base font-black text-slate-900 leading-none">
                          {formatPrice(book.priceMist)} <span className="text-[10px] text-brand-primary">SUI</span>
                        </span>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all shadow-sm">
                        <ShoppingCart className="w-4.5 h-4.5" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination THU NHỎ */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center items-center gap-2">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({top: 300, behavior: 'smooth'}); }}
                  className={`p-3 rounded-xl border border-slate-100 transition-all ${currentPage === 1 ? 'opacity-30' : 'bg-white hover:shadow-md text-brand-primary'}`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex gap-1.5">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { setCurrentPage(i + 1); window.scrollTo({top: 300, behavior: 'smooth'}); }}
                      className={`w-10 h-10 rounded-xl font-black transition-all text-xs ${currentPage === i + 1 ? 'bg-brand-primary text-white shadow-lg' : 'bg-white border border-slate-100 text-slate-400'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({top: 300, behavior: 'smooth'}); }}
                  className={`p-3 rounded-xl border border-slate-100 transition-all ${currentPage === totalPages ? 'opacity-30' : 'bg-white hover:shadow-md text-brand-primary'}`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
