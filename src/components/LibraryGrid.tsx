import { useState, useEffect } from 'react';
import { Loader2, Sparkles, AlertCircle, BookOpen, ShoppingCart, Heart, ChevronLeft, ChevronRight, MessageCircle, User } from 'lucide-react';
import { searchBooks, type BookItem } from '../lib/books-api';
import { getPaymentConfig, MIST_PER_SUI } from '../lib/payment-config';
import { useAuth } from './AuthContext';
import { useI18n } from '../i18n';
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
  const { t } = useI18n();
  const navigate = useNavigate();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const paymentConfig = getPaymentConfig();

  const toggleFav = async (e: React.MouseEvent, bookId: string) => {
    e.stopPropagation();
    if (!user) return toast.error(t('login'));

    try {
      const res = await fetch(`${paymentConfig.booksApiBaseUrl}/api/favorites/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, bookId })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        login({ ...user, favorites: data.favorites });
      }
    } catch (err) {
      console.warn('Favorite sync failed - offline mode');
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
      // Gọi API nhưng đã có logic fallback local bên trong books-api
      const result = await searchBooks('');
      setBooks(result);
      
      if (result.length === 0) {
        setError(t('noBooks'));
      }
    } catch (err) {
      // Nếu có lỗi nghiêm trọng, vẫn hiển thị thông báo nhưng không block UI
      console.error('Search failed', err);
    } finally {
      setLoading(false);
    }
  }

  function formatPrice(mist: bigint) {
    const sui = Number(mist) / Number(MIST_PER_SUI);
    return sui.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 });
  }

  const totalPages = Math.ceil(books.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentBooks = books.slice(startIndex, startIndex + itemsPerPage);

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
          <h2 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4 animate-in slide-in-from-left duration-700">
            {t('knowledgePower')} <br/>
            <span className="text-[#10b981]">{t('ownForever')}</span> on Web3.
          </h2>
          <p className="text-slate-300 text-lg mb-8 animate-in slide-in-from-left delay-100 duration-700">
            Explore our curated collection of digital books. Secure, transparent transactions on the Sui network.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 animate-in slide-in-from-left delay-200 duration-700">
            <button className="bg-[#10b981] hover:bg-[#059669] text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-[#10b981]/20 active:scale-95">
              {t('exploreNow')}
            </button>
            <button className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-black backdrop-blur-md transition-all border border-white/10 active:scale-95">
              {t('learnMore')}
            </button>
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="relative">
        {loading && books.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-[#10b981] animate-spin" />
            <p className="text-slate-500 font-medium">{t('searching')}</p>
          </div>
        ) : error && books.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <AlertCircle className="w-12 h-12 text-rose-500" />
            <p className="text-rose-600 font-medium max-w-xs">{error}</p>
            <button onClick={() => handleSearch()} className="text-[#10b981] hover:underline text-sm font-bold">{t('retry')}</button>
          </div>
        ) : (
          <div className="animate-in fade-in duration-1000">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {currentBooks.map((book) => (
                <div 
                  key={book.id} 
                  onClick={() => navigate(`/checkout/${book.id}`)}
                  className="group book-card flex flex-col h-full cursor-pointer relative bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500"
                >
                  <div className="relative aspect-[3/4] bg-slate-50 overflow-hidden">
                    {book.coverUrl ? (
                      <img 
                        src={book.coverUrl} 
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-slate-200" />
                      </div>
                    )}
                    
                    <button 
                      onClick={(e) => toggleFav(e, book.id)}
                      className="absolute top-4 right-4 p-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/50 hover:bg-white transition-all z-10 shadow-sm active:scale-90"
                    >
                      <Heart className={`w-4 h-4 ${isFav(book.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                    </button>

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="bg-white text-slate-800 font-black py-3 px-6 rounded-2xl text-xs shadow-xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                        <Sparkles className="w-4 h-4 text-[#10b981]" /> {t('buyNow')}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="text-slate-900 font-black text-sm line-clamp-2 mb-1 group-hover:text-[#10b981] transition-colors leading-tight">{book.title}</h3>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">{book.author}</p>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!user) return toast.error(t('loginToChat'));
                          (window as any).openChat?.(book);
                        }}
                        className="flex items-center gap-1.5 text-[#10b981] hover:text-[#059669] transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-black uppercase tracking-widest">{t('chatWithOwner')}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-3 mb-5 p-2.5 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                      <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t('owner')}</span>
                        <span className="text-[10px] font-mono font-bold text-slate-600 truncate">{book.owner_wallet || 'Admin'}</span>
                      </div>
                    </div>
                    
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t('price')}</span>
                        <span className="text-lg font-black text-slate-900">
                          {formatPrice(book.priceMist)} <span className="text-xs text-[#10b981]">SUI</span>
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-2xl bg-[#10b981]/10 text-[#10b981] flex items-center justify-center group-hover:bg-[#10b981] group-hover:text-white transition-all shadow-sm group-hover:shadow-lg group-hover:shadow-[#10b981]/30">
                        <ShoppingCart className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-16 flex items-center justify-center gap-3">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className={`p-4 rounded-2xl border border-slate-100 transition-all ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'bg-white hover:shadow-xl text-[#10b981]'}`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-2">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-12 h-12 rounded-2xl font-black transition-all ${currentPage === i + 1 ? 'bg-[#10b981] text-white shadow-xl shadow-[#10b981]/30' : 'bg-white border border-slate-100 text-slate-400 hover:text-[#10b981]'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className={`p-4 rounded-2xl border border-slate-100 transition-all ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : 'bg-white hover:shadow-xl text-[#10b981]'}`}
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
