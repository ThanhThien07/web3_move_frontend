import { useState, useEffect, useRef, useMemo } from 'react';
import { useI18n } from '../i18n';
import { useAuth } from './AuthContext';
import { X, Send, Loader2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ChatWidget() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_URL = 'http://localhost:5000'; // Admin API

  useEffect(() => {
    (window as any).openChat = (book?: any) => {
      setIsOpen(true);
    };
  }, []);

  useEffect(() => {
    if (isOpen && user) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/api/chats/${user.username}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to fetch messages');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim() || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);
    
    try {
      const res = await fetch(`${API_URL}/api/chats/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.username,
          userName: user.username,
          content,
          isAdmin: false
        })
      });
      if (res.ok) {
        fetchMessages();
      }
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const groupedMessages = useMemo(() => {
    return messages.reduce((acc: any[], msg: any) => {
      const lastGroup = acc[acc.length - 1];
      const msgDate = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      if (lastGroup && lastGroup.isAdmin === msg.isAdmin && lastGroup.time === msgDate) {
        lastGroup.messages.push(msg.content);
      } else {
        acc.push({
          isAdmin: msg.isAdmin,
          time: msgDate,
          messages: [msg.content]
        });
      }
      return acc;
    }, []);
  }, [messages]);

  if (!isOpen) return (
    <button 
      onClick={() => setIsOpen(true)}
      className="fixed bottom-8 right-8 w-16 h-16 bg-[#10b981] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[100] group"
    >
      <div className="absolute inset-0 bg-[#10b981] rounded-full animate-ping opacity-20 group-hover:opacity-40 transition-opacity"></div>
      <MessageCircle className="w-8 h-8 relative z-10" />
    </button>
  );

  return (
    <div className="fixed bottom-8 right-8 w-[24rem] h-[34rem] bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col z-[110] animate-in slide-in-from-bottom-10 fade-in duration-500 overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-[#10b981] text-white flex items-center justify-between shadow-lg shadow-[#10b981]/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-lg rotate-3">
            AL
          </div>
          <div>
            <h4 className="font-black text-sm leading-none">Alpha Support</h4>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></div>
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest block">Online</span>
            </div>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-2.5 hover:bg-white/10 rounded-xl transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-slate-50/30">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-[2rem] bg-emerald-50 text-[#10b981] flex items-center justify-center mb-6 rotate-6">
              <MessageCircle className="w-10 h-10" />
            </div>
            <h5 className="text-slate-800 font-black mb-2">Xin chào!</h5>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">Bạn cần tư vấn về sách hay quy trình mua hàng? Đừng ngần ngại đặt câu hỏi nhé!</p>
          </div>
        ) : (
          groupedMessages.map((group, i) => (
            <div key={i} className={`flex flex-col ${group.isAdmin ? 'items-start' : 'items-end'} space-y-1`}>
              {group.messages.map((text: string, j: number) => (
                <div key={j} className={`
                  max-w-[85%] p-3.5 text-sm font-medium shadow-sm transition-all
                  ${group.isAdmin 
                    ? 'bg-white text-slate-700 border border-slate-100 rounded-2xl rounded-tl-none first:rounded-tl-none' 
                    : 'bg-[#10b981] text-white rounded-2xl rounded-tr-none first:rounded-tr-none'}
                  ${j > 0 ? (group.isAdmin ? 'rounded-tl-2xl' : 'rounded-tr-2xl') : ''}
                `}>
                  {text}
                </div>
              ))}
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 mx-1">
                {group.time}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 bg-white border-t border-slate-50">
        {user ? (
          <form onSubmit={handleSend} className="flex gap-3">
            <input 
              type="text"
              placeholder={t('typeMessage')}
              className="flex-grow bg-slate-50 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-[#10b981]/20 transition-all placeholder:text-slate-400"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
            />
            <button 
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="w-14 h-14 bg-[#10b981] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#10b981]/20 active:scale-95 disabled:opacity-50 transition-all"
            >
              {sending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
            </button>
          </form>
        ) : (
          <div className="text-center py-2 px-4 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              {t('loginToChat')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
