import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSuiClient, useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { BookOpen, ShieldCheck, Wallet, ArrowLeft, Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../components/AuthContext';
import { getPaymentConfig, MIST_PER_SUI } from '../lib/payment-config';
import { type BookItem } from '../lib/books-api';

const NETWORKS = [
  { id: 'devnet', name: 'Devnet (Thử nghiệm)', color: 'bg-indigo-500' },
  { id: 'testnet', name: 'Testnet (Thử nghiệm)', color: 'bg-[#f59e0b]' },
  { id: 'mainnet', name: 'Mainnet (Tiền thật)', color: 'bg-[#10b981]' },
];

export default function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [book, setBook] = useState<BookItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [network, setNetwork] = useState('testnet');

  const paymentConfig = getPaymentConfig();

  useEffect(() => {
    async function fetchBook() {
      try {
        const res = await fetch(`${paymentConfig.booksApiBaseUrl}/api/books`);
        const books = await res.json();
        const found = books.find((b: any) => b.id === id);
        if (found) {
          setBook({
            id: found.id,
            title: found.title,
            author: found.author,
            coverUrl: found.cover_url,
            priceMist: BigInt(found.price_mist),
            owner_wallet: found.owner_wallet
          });
        } else {
          toast.error('Không tìm thấy sách');
        }
      } catch (err) {
        toast.error('Lỗi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    }
    fetchBook();
  }, [id, paymentConfig.booksApiBaseUrl]);

  const handlePayment = async () => {
    if (!account) return toast.error('Vui lòng kết nối ví SUI');
    if (!user || !book) return toast.error('Vui lòng đăng nhập tài khoản');

    setPaying(true);
    try {
      const tx = new Transaction();
      const amount = book.priceMist;

      // Transfer to Owner Wallet (or Treasury if not specified)
      const receiver = book.owner_wallet || paymentConfig.receiver;
      const [coin] = tx.splitCoins(tx.gas, [amount]);
      tx.transferObjects([coin], receiver);

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            const res = await fetch(`${paymentConfig.booksApiBaseUrl}/api/verify-purchase`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                username: user.username,
                bookId: book.id,
                digest: result.digest,
                walletAddress: account.address,
                amount: (Number(book.priceMist) / Number(MIST_PER_SUI)).toString(),
                network: network
              })
            });

            if (res.ok) {
              toast.success('Thanh toán thành công!');
              navigate('/collection');
            } else {
              toast.error('Thanh toán thành công nhưng xác thực thất bại. Vui lòng liên hệ hỗ trợ.');
            }
          },
          onError: (err) => {
            toast.error(`Giao dịch thất bại: ${err.message}`);
          }
        }
      );
    } catch (err: any) {
      toast.error(err.message || 'Lỗi giao dịch');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin w-10 h-10 text-[#10b981]" /></div>;
  if (!book) return <div className="text-center py-20">Sách không tồn tại</div>;

  const displayPrice = (Number(book.priceMist) / Number(MIST_PER_SUI)).toFixed(2);

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 sm:px-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Quay lại
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-6 md:gap-8">
            <div className="w-full sm:w-40 aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden shadow-md shrink-0">
              {book.coverUrl ? (
                <img src={book.coverUrl} className="w-full h-full object-cover" alt={book.title} />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-8 h-8 text-slate-300" /></div>
              )}
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <h1 className="text-2xl font-black text-slate-800 leading-tight">{book.title}</h1>
                <p className="text-slate-500 font-medium">{book.author}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-[#10b981]/10 text-[#10b981] rounded-full text-xs font-bold uppercase tracking-wider">Web3 Edition</span>
                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold uppercase tracking-wider">E-Book</span>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                Cuốn sách này sẽ được đính kèm vào địa chỉ ví của bạn dưới dạng hồ sơ sở hữu vĩnh viễn trên blockchain. Bạn có thể truy cập nội dung bất cứ lúc nào sau khi thanh toán.
              </p>
            </div>
          </div>

          <div className="bg-[#10b981]/5 rounded-3xl p-6 border border-[#10b981]/10 flex gap-4 items-start">
            <ShieldCheck className="w-6 h-6 text-[#10b981] shrink-0" />
            <div className="space-y-1">
              <h4 className="font-bold text-slate-800">Thanh toán bảo mật</h4>
              <p className="text-sm text-slate-500">Giao dịch của bạn được xử lý trực tiếp thông qua Smart Contract của Sui Network. Không ai có quyền truy cập vào tiền của bạn trừ khi bạn xác nhận.</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl space-y-6 sticky top-24">
            <h3 className="text-xl font-black text-slate-800">Hóa đơn</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between text-slate-500 text-sm">
                <span>Giá sách</span>
                <span>{displayPrice} SUI</span>
              </div>
              <div className="flex justify-between text-slate-500 text-sm">
                <span>Phí mạng (ước tính)</span>
                <span>~0.001 SUI</span>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-800">Tổng cộng</span>
                <span className="text-2xl font-black text-[#10b981]">{displayPrice} SUI</span>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chọn mạng lưới</label>
              <div className="grid grid-cols-1 gap-2">
                {NETWORKS.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setNetwork(n.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      network === n.id 
                      ? 'border-[#10b981] bg-[#10b981]/5 ring-2 ring-[#10b981]/20' 
                      : 'border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${n.color}`}></div>
                      <span className="text-sm font-bold text-slate-700">{n.name}</span>
                    </div>
                    {network === n.id && <div className="w-2 h-2 bg-[#10b981] rounded-full"></div>}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handlePayment}
              disabled={paying}
              className="w-full primary-button py-4 flex items-center justify-center gap-2 group"
            >
              {paying ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CreditCard className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Thanh toán ngay
                </>
              )}
            </button>

            <div className="flex items-center gap-2 justify-center text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
              <Wallet className="w-3 h-3" />
              Kết nối: {account ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}` : 'Chưa kết nối'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
