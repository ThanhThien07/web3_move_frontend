import { useState } from 'react';
import { X, ShoppingCart, Loader2, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { useSuiClient, useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { type BookItem } from '../lib/books-api';
import { getPaymentConfig, MIST_PER_SUI } from '../lib/payment-config';
import { toast } from 'sonner';

interface BookDetailModalProps {
  book: BookItem;
  onClose: () => void;
}

export default function BookDetailModal({ book, onClose }: BookDetailModalProps) {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const paymentConfig = getPaymentConfig();

  async function handlePurchase() {
    if (!account) {
      toast.error('Vui lòng kết nối ví để thanh toán');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // 🚀 SỬ DỤNG TRANSACTION TRỰC TIẾP ĐỂ TRÁNH LỖI BUILD
      const tx = new Transaction();
      const amount = book.priceMist;

      // Gửi tiền trực tiếp cho người bán
      const receiver = book.owner_wallet === 'Admin' ? paymentConfig.receiver : book.owner_wallet;
      const [coin] = tx.splitCoins(tx.gas, [amount]);
      tx.transferObjects([coin], receiver);

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            // Đợi xác nhận giao dịch
            await client.waitForTransaction({ digest: result.digest });

            // Đồng bộ với backend (nếu có)
            try {
              await fetch(`${paymentConfig.booksApiBaseUrl}/api/verify-purchase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  bookId: book.id,
                  digest: result.digest,
                  walletAddress: account.address,
                  amount: (Number(book.priceMist) / Number(MIST_PER_SUI)).toString()
                })
              });
            } catch (e) {
              console.warn('Sync failed - transaction is still successful on-chain');
            }

            setSuccess(true);
            toast.success('Thanh toán thành công!');
          },
          onError: (err) => {
            setError(err.message);
            toast.error('Giao dịch thất bại');
          }
        }
      );
    } catch (err: any) {
      setError(err.message || 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  }

  const priceSui = (Number(book.priceMist) / Number(MIST_PER_SUI)).toFixed(2);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        {/* Book Cover */}
        <div className="w-full md:w-2/5 aspect-3/4 md:aspect-auto bg-slate-100 relative group">
          <img src={book.coverUrl} className="w-full h-full object-cover" alt={book.title} />
          <div className="absolute inset-0 bg-linear-to-t from-slate-900/40 to-transparent"></div>
        </div>

        {/* Content */}
        <div className="grow p-8 md:p-10 flex flex-col">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>

          <div className="space-y-6 grow">
            <div>
              <h2 className="text-2xl font-black text-slate-900 leading-tight mb-2">{book.title}</h2>
              <p className="text-slate-500 font-bold">{book.author}</p>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-3xl font-black text-brand-primary">{priceSui} <span className="text-sm">SUI</span></span>
              <div className="h-6 w-px bg-slate-200"></div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Digital E-Book</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
              <ShieldCheck className="w-5 h-5 text-brand-primary mt-0.5" />
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Sở hữu vĩnh viễn trên Blockchain. Bạn có thể truy cập nội dung ngay sau khi giao dịch được xác nhận.
              </p>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-3 text-rose-600 text-xs font-bold">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-slate-50">
            {success ? (
              <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-300">
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <p className="text-emerald-600 font-black text-sm uppercase tracking-widest">Mua hàng thành công!</p>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-xs">Đóng cửa sổ</button>
              </div>
            ) : (
              <button
                onClick={handlePurchase}
                disabled={loading}
                className="w-full bg-brand-primary hover:bg-brand-primary/90 disabled:bg-slate-200 text-white py-5 rounded-2xl font-black shadow-xl shadow-brand-primary/20 transition-all flex items-center justify-center gap-3 group active:scale-95"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <ShoppingCart className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    MUA NGAY BẰNG SUI
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
