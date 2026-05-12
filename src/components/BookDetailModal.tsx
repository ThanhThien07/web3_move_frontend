import { useState } from 'react';
import { useCurrentAccount, useCurrentClient, useDAppKit } from '@mysten/dapp-kit-react';
import { X, ShoppingCart, Loader2, CheckCircle2, AlertTriangle, ExternalLink, BookOpen } from 'lucide-react';
import { type BookItem } from '../lib/books-api';
import { getPaymentConfig, MIST_PER_SUI } from '../lib/payment-config';
import { buildPaymentTx, parsePaymentResult } from '../lib/payment-tx';
import { requestBookFulfillment } from '../lib/fulfillment-api';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

interface BookDetailModalProps {
  book: BookItem;
  onClose: () => void;
  onSuccess: (record: any) => void;
}

export default function BookDetailModal({ book, onClose, onSuccess }: BookDetailModalProps) {
  const account = useCurrentAccount();
  const client = useCurrentClient();
  const dAppKit = useDAppKit();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [accessUrl, setAccessUrl] = useState<string | null>(null);

  const paymentConfig = getPaymentConfig();

  async function handlePurchase() {
    if (!account) return;
    setLoading(true);
    setError(null);

    try {
      const tx = await buildPaymentTx(
        paymentConfig,
        book.priceMist,
        client,
        account.address,
        book.id
      );

      const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });
      try {
        const parsed = parsePaymentResult(result as any);
        await client.waitForTransaction({ digest: parsed.digest });
        
        const fulfillment = await requestBookFulfillment({
          config: paymentConfig,
          book,
          walletAddress: account.address,
          digest: parsed.digest,
        });

        const record = {
          bookId: book.id,
          title: book.title,
          digest: parsed.digest,
          accessUrl: fulfillment.accessUrl,
          message: fulfillment.message,
          createdAt: new Date().toISOString(),
        };

        setAccessUrl(fulfillment.accessUrl);
        setSuccess(true);
        onSuccess(record);
        toast.success(`Mua sách "${book.title}" thành công!`);
      } catch (err: any) {
        setError(err.message || 'Lỗi xử lý đơn hàng.');
      } finally {
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Giao dịch thất bại.');
      setLoading(false);
    }
  }

  function formatPrice(mist: bigint) {
    return (Number(mist) / Number(MIST_PER_SUI)).toLocaleString();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col md:flex-row">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 z-10 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Left: Image */}
        <div className="relative aspect-[3/4] md:aspect-auto md:w-1/2 h-full min-h-[400px] bg-slate-100">
          {book.coverUrl ? (
            <img 
              src={book.coverUrl} 
              alt={book.title} 
              className="w-full h-full object-cover mix-blend-multiply"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-24 h-24 text-slate-300" />
            </div>
          )}
        </div>

        {/* Right: Content */}
        <div className="p-8 md:w-1/2 flex flex-col justify-center space-y-6">
          <div className="space-y-2">
            <span className="text-[#10b981] text-sm font-bold uppercase tracking-widest">Sách điện tử</span>
            <h2 className="text-3xl font-black text-slate-800 leading-tight">{book.title}</h2>
            <p className="text-slate-500">Tác giả: <span className="text-slate-700 font-semibold">{book.author}</span></p>
          </div>

          <div className="py-6 border-y border-slate-100 space-y-4">
            <p className="text-slate-600 text-sm leading-relaxed">
              Mua và sở hữu cuốn sách này vĩnh viễn trên blockchain Sui. Giao dịch an toàn, minh bạch và nhanh chóng.
            </p>
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-slate-600 font-medium">Giá bán:</span>
              <span className="text-2xl font-black text-[#f59e0b]">
                {formatPrice(book.priceMist)} <span className="text-base text-slate-500 font-semibold">SUI</span>
              </span>
            </div>
          </div>

          {!account ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-sm text-amber-700 leading-relaxed">
                Vui lòng kết nối ví Sui của bạn để thực hiện thanh toán.
              </p>
            </div>
          ) : success ? (
            <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-500">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <div>
                  <p className="text-sm font-bold text-emerald-700">Thanh toán thành công!</p>
                  <p className="text-xs text-emerald-600">Sách đã được thêm vào tủ sách của bạn.</p>
                </div>
              </div>
              <a 
                href={accessUrl || '#'} 
                target="_blank" 
                rel="noreferrer"
                className="w-full py-4 bg-[#10b981] hover:bg-[#059669] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-[#10b981]/20"
              >
                <ExternalLink className="w-5 h-5" /> Đọc sách ngay
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              <button 
                disabled={loading}
                onClick={handlePurchase}
                className="w-full py-4 bg-[#10b981] hover:bg-[#059669] disabled:bg-slate-300 disabled:text-slate-500 text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-md shadow-[#10b981]/20 group relative overflow-hidden"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Đang xử lý giao dịch...</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    <span>Mua bằng SUI</span>
                  </>
                )}
              </button>
              
              {error && (
                <p className="text-center text-sm text-rose-500 font-medium bg-rose-50 p-2 rounded-lg">{error}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
