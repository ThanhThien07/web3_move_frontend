import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { Clock, Book, CreditCard, ExternalLink, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { getPaymentConfig } from '../lib/payment-config';

export default function PurchaseHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      if (!user) return;
      try {
        const config = getPaymentConfig();
        const res = await fetch(`${config.booksApiBaseUrl}/api/purchases?username=${user.username}`);
        const data = await res.json();
        if (res.ok) {
          setHistory(data);
        }
      } catch (err) {
        toast.error('Không thể tải lịch sử mua hàng');
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [user]);

  if (!user) return <div className="text-center py-20 font-bold">Vui lòng đăng nhập để xem lịch sử</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pt-6 px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
          <Clock className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-800">Lịch sử giao dịch</h1>
          <p className="text-slate-500">Xem lại các cuốn sách bạn đã mua và chi tiết thanh toán.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 font-medium">Đang tải lịch sử...</div>
      ) : history.length === 0 ? (
        <div className="bg-white rounded-3xl p-20 border border-slate-100 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
            <CreditCard className="w-8 h-8 text-slate-200" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Chưa có giao dịch nào</h3>
          <p className="text-slate-500">Những cuốn sách bạn mua sẽ xuất hiện tại đây.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Sách</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Ngày mua</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Số tiền</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Phương thức</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-12 bg-slate-100 rounded border border-slate-200 flex items-center justify-center shrink-0">
                        <Book className="w-5 h-5 text-slate-400" />
                      </div>
                      <span className="font-bold text-slate-800 line-clamp-1">{item.book_title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-600">
                    {new Date(item.created_at).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-5">
                    <span className="font-black text-slate-800">{item.amount || '0.1'} SUI</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        item.network === 'mainnet' ? 'bg-[#10b981]' : 
                        item.network === 'testnet' ? 'bg-[#f59e0b]' : 'bg-indigo-500'
                      }`}></div>
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{item.network || 'testnet'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <a 
                      href={`https://suiscan.xyz/${item.network || 'testnet'}/tx/${item.digest}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#10b981]/10 text-[#10b981] rounded-full text-[10px] font-black uppercase tracking-tighter hover:bg-[#10b981] hover:text-white transition-all"
                    >
                      Xác thực <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
