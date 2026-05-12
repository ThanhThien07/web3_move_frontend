import { useState, useEffect } from 'react';
import { ConnectButton } from '@mysten/dapp-kit';
import { BookOpen, Search, Gift, LogOut, User as UserIcon, Heart, Menu, X, History } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import AuthModal from './AuthModal';
import { getPaymentConfig } from '../lib/payment-config';
import { toast } from 'sonner';

export default function Navbar() {
  const [showAuth, setShowAuth] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, login: updateAuthUser, logout } = useAuth();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const location = useLocation();

  // Load and sync countdown
  useEffect(() => {
    const checkCountdown = () => {
      if (user?.last_checkin) {
        const lastCheckinDate = new Date(user.last_checkin).getTime();
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        
        if (user.last_checkin === todayStr) {
          // Calculate ms until tomorrow
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          const remaining = tomorrow.getTime() - now.getTime();
          setTimeLeft(Math.floor(remaining / 1000));
        } else {
          setTimeLeft(0);
        }
      } else {
        setTimeLeft(0);
      }
    };

    checkCountdown();
    const timer = setInterval(checkCountdown, 1000);
    return () => clearInterval(timer);
  }, [user]);

  const handleCheckin = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để điểm danh');
      return setShowAuth(true);
    }

    const config = getPaymentConfig();
    try {
      const res = await fetch(`${config.booksApiBaseUrl}/api/faucet/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message);
        if (data.user) {
          updateAuthUser(data.user);
        }
      } else {
        toast.error(data.error || 'Lỗi điểm danh');
      }
    } catch (err) {
      toast.error('Không thể kết nối máy chủ để điểm danh');
    }
  };

  const formatTimeLeft = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const isActive = (path: string) => location.pathname === path;

  const NavLinks = () => (
    <>
      <Link 
        to="/" 
        onClick={() => setIsMenuOpen(false)}
        className={`flex items-center gap-2 transition-colors relative group ${isActive('/') ? 'text-[#10b981]' : 'text-slate-600 md:text-slate-800 hover:text-[#10b981]'}`}
      >
        <BookOpen className="w-4 h-4 md:hidden" />
        Nhà sách
        <span className={`hidden md:block absolute -bottom-1 left-0 h-0.5 bg-[#10b981] transition-all group-hover:w-full ${isActive('/') ? 'w-full' : 'w-0'}`}></span>
      </Link>
      <Link 
        to="/favorites" 
        onClick={() => setIsMenuOpen(false)}
        className={`flex items-center gap-2 transition-colors relative group ${isActive('/favorites') ? 'text-[#10b981]' : 'text-slate-600 md:text-slate-500 hover:text-[#10b981]'}`}
      >
        <Heart className="w-4 h-4 md:hidden" />
        Yêu thích
        <span className={`hidden md:block absolute -bottom-1 left-0 h-0.5 bg-[#10b981] transition-all group-hover:w-full ${isActive('/favorites') ? 'w-full' : 'w-0'}`}></span>
      </Link>
      <Link 
        to="/collection" 
        onClick={() => setIsMenuOpen(false)}
        className={`flex items-center gap-2 transition-colors relative group ${isActive('/collection') ? 'text-[#10b981]' : 'text-slate-600 md:text-slate-500 hover:text-[#10b981]'}`}
      >
        <BookOpen className="w-4 h-4 md:hidden" />
        Tủ sách
        <span className={`hidden md:block absolute -bottom-1 left-0 h-0.5 bg-[#10b981] transition-all group-hover:w-full ${isActive('/collection') ? 'w-full' : 'w-0'}`}></span>
      </Link>
      <Link 
        to="/history" 
        onClick={() => setIsMenuOpen(false)}
        className={`flex items-center gap-2 transition-colors relative group ${isActive('/history') ? 'text-[#10b981]' : 'text-slate-600 md:text-slate-500 hover:text-[#10b981]'}`}
      >
        <History className="w-4 h-4 md:hidden" />
        Lịch sử
        <span className={`hidden md:block absolute -bottom-1 left-0 h-0.5 bg-[#10b981] transition-all group-hover:w-full ${isActive('/history') ? 'w-full' : 'w-0'}`}></span>
      </Link>
    </>
  );

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-20 px-4 md:px-6 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 md:hidden text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          <Link to="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-[#10b981] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
              <BookOpen className="text-white w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg md:text-xl font-bold tracking-tight text-slate-800 leading-none">AlphaLibrary</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#059669]">Web3 BookStore</span>
            </div>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-semibold">
          <NavLinks />
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button className="p-2 text-slate-500 hover:text-[#10b981] transition-colors rounded-full hover:bg-slate-50 hidden sm:block">
            <Search className="w-5 h-5" />
          </button>
          
          <div className="h-6 w-[1px] bg-slate-200 mx-1 hidden lg:block"></div>

          {user ? (
            <div className="flex items-center gap-2 md:gap-3">
              <button 
                onClick={handleCheckin}
                disabled={timeLeft > 0}
                className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-xs md:text-sm transition-colors ${
                  timeLeft > 0 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-[#f59e0b]/10 text-[#f59e0b] hover:bg-[#f59e0b]/20'
                }`}
              >
                <Gift className="w-4 h-4" />
                <span className="hidden lg:inline">{timeLeft > 0 ? formatTimeLeft(timeLeft) : 'Điểm danh SUI'}</span>
                {timeLeft > 0 && <span className="lg:hidden">{Math.floor(timeLeft/3600)}h</span>}
              </button>
              
              <div className="flex items-center gap-2 bg-slate-50 px-2 md:px-3 py-1.5 rounded-lg border border-slate-200 max-w-[120px] md:max-w-none">
                <UserIcon className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs md:text-sm font-semibold text-slate-700 truncate">{user.username}</span>
                <button onClick={logout} className="ml-1 text-slate-400 hover:text-red-500">
                  <LogOut className="w-3 h-3 md:w-4 h-4" />
                </button>
              </div>
              <div className="scale-90 md:scale-100 origin-right">
                <ConnectButton className="!bg-[#10b981] hover:!bg-[#059669] !rounded-lg !px-3 md:!px-4 !py-2 !text-[10px] md:!text-sm !font-semibold !transition-all !border-none !shadow-none" />
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowAuth(true)}
              className="primary-button text-[10px] md:text-sm py-2 px-3 md:py-2 md:px-6"
            >
              Đăng nhập
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
          <div className="absolute top-20 left-0 right-0 bg-white border-b border-slate-200 p-6 space-y-6 shadow-xl animate-in slide-in-from-top duration-300">
            <div className="flex flex-col gap-4 text-lg font-bold">
              <NavLinks />
            </div>
            {!user && (
               <button 
               onClick={() => { setShowAuth(true); setIsMenuOpen(false); }}
               className="w-full primary-button py-4"
             >
               Đăng nhập / Đăng ký
             </button>
            )}
            {user && (
              <button 
                onClick={() => { handleCheckin(); setIsMenuOpen(false); }}
                disabled={timeLeft > 0}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-colors ${
                  timeLeft > 0 
                  ? 'bg-slate-100 text-slate-400' 
                  : 'bg-[#f59e0b]/10 text-[#f59e0b]'
                }`}
              >
                <Gift className="w-5 h-5" />
                {timeLeft > 0 ? `Đã điểm danh (${formatTimeLeft(timeLeft)})` : 'Điểm danh nhận SUI Miễn phí'}
              </button>
            )}
          </div>
        </div>
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
