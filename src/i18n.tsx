import { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'vi';

interface Translations {
  [key: string]: {
    [lang in Language]: string;
  };
}

const translations: Translations = {
  home: { en: 'Home', vi: 'Trang chủ' },
  myCollection: { en: 'My Collection', vi: 'Bộ sưu tập' },
  favorites: { en: 'Favorites', vi: 'Yêu thích' },
  history: { en: 'History', vi: 'Lịch sử' },
  login: { en: 'Login', vi: 'Đăng nhập' },
  logout: { en: 'Logout', vi: 'Đăng xuất' },
  searchBooks: { en: 'Search books...', vi: 'Tìm sách...' },
  knowledgePower: { en: 'Knowledge is Power.', vi: 'Tri thức là sức mạnh.' },
  ownForever: { en: 'Own Forever', vi: 'Sở hữu vĩnh viễn' },
  exploreNow: { en: 'Explore Now', vi: 'Khám phá ngay' },
  learnMore: { en: 'Learn More', vi: 'Tìm hiểu thêm' },
  buyNow: { en: 'Buy Now', vi: 'Mua ngay' },
  searching: { en: 'Searching books...', vi: 'Đang tìm sách...' },
  noBooks: { en: 'No books found.', vi: 'Không tìm thấy sách nào.' },
  retry: { en: 'Retry', vi: 'Thử lại' },
  footerText: { en: '© 2026 ITC Web3 Decentralized Library.', vi: '© 2026 Thư viện phi tập trung ITC Web3.' },
  itemsPerPage: { en: 'Items per page', vi: 'Số bản ghi mỗi trang' },
  page: { en: 'Page', vi: 'Trang' },
  chatWithOwner: { en: 'Consultation', vi: 'Tư vấn ngay' },
  chat: { en: 'Chat', vi: 'Chat' },
  owner: { en: 'Seller', vi: 'Người bán' },
  typeMessage: { en: 'Type a message...', vi: 'Nhập tin nhắn...' },
  send: { en: 'Send', vi: 'Gửi' },
  loginToChat: { en: 'Please login to chat', vi: 'Vui lòng đăng nhập để chat' },
  discover: { en: 'Discover', vi: 'Khám phá' },
  price: { en: 'Price', vi: 'Giá bán' },
  fetchError: { en: 'Failed to fetch books', vi: 'Lỗi tải danh sách sách' },
  searchPlaceholder: { en: 'Search for books or authors...', vi: 'Tìm tên sách hoặc tác giả...' },
};

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

export const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('lang') as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const t = (key: string): string => {
    const translation = (translations as any)[key];
    return translation?.[lang] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}
