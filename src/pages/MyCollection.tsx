import { useState, useEffect } from 'react';
import PurchasedBooks from '../components/PurchasedBooks';
import { BookOpen } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { Link } from 'react-router-dom';

export default function MyCollection() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const { user } = useAuth();
  const PURCHASES_KEY = 'itc-library-purchases';

  useEffect(() => {
    const saved = localStorage.getItem(PURCHASES_KEY);
    if (saved) {
      try {
        setPurchases(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse purchases', e);
      }
    }
  }, []);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
          <BookOpen className="w-10 h-10 text-slate-300" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Vui lòng đăng nhập</h2>
        <p className="text-slate-500 max-w-md">
          Bạn cần đăng nhập để xem tủ sách của mình. Nếu bạn đã mua sách trước đó, chúng được lưu trữ an toàn trên blockchain Sui.
        </p>
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
          <BookOpen className="w-10 h-10 text-slate-300" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Tủ sách trống</h2>
        <p className="text-slate-500 max-w-md">
          Bạn chưa sở hữu cuốn sách nào. Hãy khám phá thư viện của chúng tôi và chọn cho mình những cuốn sách yêu thích nhé.
        </p>
        <Link to="/" className="primary-button inline-flex mt-4">
          Khám phá sách ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-6">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-800 mb-2">Tủ sách của {user.username}</h1>
        <p className="text-slate-500">Tất cả những cuốn sách bạn đã mua và sở hữu vĩnh viễn trên mạng lưới Web3.</p>
      </div>
      <PurchasedBooks purchases={purchases} />
    </div>
  );
}
