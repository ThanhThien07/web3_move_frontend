import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { getPaymentConfig } from '../lib/payment-config';
import { X, User, Lock, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { useI18n } from '../i18n';

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const config = getPaymentConfig();
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await fetch(`${config.booksApiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        login(data.user);
        toast.success(isLogin ? (t('loginSuccess') || 'Đăng nhập thành công!') : (t('registerSuccess') || 'Đăng ký thành công!'));
        onClose();
      } else {
        toast.error(data.error || 'Đã có lỗi xảy ra');
      }
    } catch (err) {
      toast.error('Không thể kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>
      
      {/* Modal */}
      <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl relative overflow-hidden animate-in zoom-in-95 fade-in duration-300 border border-slate-100 group">
        {/* Subtle background glow */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl group-hover:bg-brand-primary/20 transition-all duration-700"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center rotate-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">
                {isLogin ? t('login') : t('register')}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-10 text-center">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-brand-primary rounded-full mb-4">
               <Sparkles className="w-3.5 h-3.5" />
               <span className="text-[10px] font-black uppercase tracking-widest">{isLogin ? 'Welcome Back' : 'Create Account'}</span>
             </div>
             <p className="text-slate-500 text-sm font-medium leading-relaxed">
               {isLogin ? 'Đăng nhập để truy cập kho sách và tham gia cộng đồng Web3.' : 'Khám phá thế giới tri thức minh bạch trên Sui Blockchain.'}
             </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Tên đăng nhập</label>
              <div className="relative group/input">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within/input:text-brand-primary transition-colors" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-16 pr-6 text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-brand-primary/10 transition-all font-bold text-sm shadow-inner"
                  placeholder="admin_alpha"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Mật khẩu</label>
              <div className="relative group/input">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within/input:text-brand-primary transition-colors" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-16 pr-6 text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-brand-primary/10 transition-all font-bold text-sm shadow-inner"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary hover:bg-brand-secondary text-white py-5 rounded-2xl font-black shadow-xl shadow-brand-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group/btn"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <span className="uppercase tracking-widest">{isLogin ? t('login') : t('register')}</span>
                  <Sparkles className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-50 text-center">
            <p className="text-slate-500 text-xs font-bold mb-4">
              {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
            </p>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="w-full py-4 rounded-2xl bg-slate-50 text-slate-700 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-100 hover:text-brand-primary transition-all active:scale-[0.98]"
            >
              {isLogin ? t('register') : t('login')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
