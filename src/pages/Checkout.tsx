import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { ShieldCheck, Wallet, ArrowLeft, Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../components/AuthContext';
import { getPaymentConfig, MIST_PER_SUI } from '../lib/payment-config';
import { type BookItem } from '../lib/books-api';
import localBooks from '../data/books.json';

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
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [book, setBook] = useState<BookItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [network, setNetwork] = useState('testnet');

  const paymentConfig = getPaymentConfig();

  useEffect(() => {
    // ƯU TIÊN LẤY DỮ LIỆU TỪ FRONTEND ĐỂ HIỂN THỊ NGAY LẬP TỨC
    const found = localBooks.find((b: any) => b.id === id);
    if (found) {
      setBook({
        id: found.id,
        title: found.title,
        author: found.author,
        coverUrl: found.coverUrl,
        priceMist: BigInt(found.priceMist),
        owner_wallet: found.owner_wallet || 'Admin'
      });
      setLoading(false);
    } else {
      // Nếu không có trong local, thử gọi API (phần này để dự phòng)
      fetch(`${paymentConfig.booksApiBaseUrl}/api/books`)
        .then(res => res.json())
        .then(data => {
          const items = Array.isArray(data) ? data : (data.items || []);
          const serverFound = items.find((b: any) => b.id === id);
          if (serverFound) {
            setBook({
              id: serverFound.id,
              title: serverFound.title,
              author: serverFound.author,
              coverUrl: serverFound.cover_url,
              priceMist: BigInt(serverFound.price_mist),
              owner_wallet: serverFound.owner_wallet
            });
          } else {
            toast.error('Không tìm thấy sách');
          }
        })
        .catch(() => toast.error('Lỗi tải dữ liệu từ server'))
        .finally(() => setLoading(false));
    }
  }, [id, paymentConfig.booksApiBaseUrl]);

  const handlePayment = async () => {
    if (!account) return toast.error('Vui lòng kết nối ví SUI');
    if (!user || !book) return toast.error('Vui lòng đăng nhập tài khoản');

    setPaying(true);
    try {
      const tx = new Transaction();
      const amount = book.priceMist;

      // Gửi tiền trực tiếp cho người bán (owner_wallet)
      const receiver = book.owner_wallet === 'Admin' ? paymentConfig.receiver : book.owner_wallet;
      const [coin] = tx.splitCoins(tx.gas, [amount]);
      tx.transferObjects([coin], receiver);

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            // Xác thực giao dịch (Nếu có server backend)
            try {
              await fetch(`${paymentConfig.booksApiBaseUrl}/api/verify-purchase`, {
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
            } catch (e) {
              console.warn('Backend offline, skip verification step.');
            }

            toast.success('Thanh toán thành công trên Blockchain!');
            navigate('/collection');
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

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin w-10 h-10 text-brand-primary" /></div>;
  if (!book) return <div className="text-center py-20">Sách không tồn tại</div>;

  const displayPrice = (Number(book.priceMist) / Number(MIST_PER_SUI)).toFixed(2);

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 sm:px-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Quay lại
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-8">
            <div className="w-full sm:w-48 aspect-3/4 bg-slate-100 rounded-2xl overflow-hidden shadow-xl shrink-0 group">
              <img src={book.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={book.title} />
            </div>
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-black text-slate-900 leading-tight mb-2">{book.title}</h1>
                <p className="text-slate-500 font-bold text-lg">{book.author}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-4 py-1.5 bg-brand-primary/10 text-brand-primary rounded-xl text-[10px] font-black uppercase tracking-widest">Web3 Edition</span>
                <span className="px-4 py-1.5 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest">Digital Asset</span>
              </div>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">Người bán (Seller Wallet)</p>
                <p className="text-[10px] font-mono font-bold text-slate-400 break-all">{book.owner_wallet}</p>
              </div>
            </div>
          </div>

          <div className="bg-emerald-500/5 rounded-[2.5rem] p-8 border border-emerald-500/10 flex gap-6 items-start">
            <ShieldCheck className="w-8 h-8 text-brand-primary shrink-0" />
            <div className="space-y-2">
              <h4 className="font-black text-slate-900">Bảo mật tuyệt đối</h4>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">Giao dịch được thực hiện trực tiếp thông qua Smart Contract trên Sui Blockchain. Tiền của bạn sẽ được chuyển thẳng đến ví của người bán mà không thông qua trung gian.</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-2xl shadow-slate-200/50 space-y-8 sticky top-24">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">Hóa đơn chi tiết</h3>

            <div className="space-y-4">
              <div className="flex justify-between text-slate-400 font-bold text-xs uppercase tracking-wider">
                <span>Giá sản phẩm</span>
                <span className="text-slate-900">{displayPrice} SUI</span>
              </div>
              <div className="flex justify-between text-slate-400 font-bold text-xs uppercase tracking-wider">
                <span>Phí mạng ước tính</span>
                <span className="text-slate-900">~0.001 SUI</span>
              </div>
              <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                <span className="font-black text-slate-900 text-lg uppercase tracking-widest">Tổng cộng</span>
                <span className="text-3xl font-black text-brand-primary">{displayPrice} <span className="text-sm">SUI</span></span>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Mạng lưới giao dịch</label>
              <div className="grid grid-cols-1 gap-2">
                {NETWORKS.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setNetwork(n.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${network === n.id
                        ? 'border-brand-primary bg-brand-primary/5 shadow-inner'
                        : 'border-slate-50 hover:border-slate-200 bg-slate-50/30'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${n.color} shadow-sm`}></div>
                      <span className={`text-xs font-black uppercase tracking-widest ${network === n.id ? 'text-emerald-700' : 'text-slate-400'}`}>{n.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={paying}
              className="w-full bg-brand-primary hover:bg-brand-secondary disabled:bg-slate-200 text-white py-5 rounded-2xl font-black shadow-xl shadow-brand-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
            >
              {paying ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <CreditCard className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  XÁC NHẬN THANH TOÁN
                </>
              )}
            </button>

            <div className="flex items-center gap-2 justify-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] pt-4">
              <Wallet className="w-3 h-3" />
              Ví: {account ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}` : 'Chưa kết nối'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
