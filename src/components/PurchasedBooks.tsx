import { Clock, ExternalLink, Hash } from 'lucide-react';

interface PurchaseRecord {
  bookId: string;
  title: string;
  digest: string;
  accessUrl: string;
  message: string;
  createdAt: string;
}

interface PurchasedBooksProps {
  purchases: PurchaseRecord[];
}

export default function PurchasedBooks({ purchases }: PurchasedBooksProps) {
  if (purchases.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-brand-primary/10 rounded-lg border border-brand-primary/20">
          <Clock className="w-5 h-5 text-brand-primary" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-800">Hoạt động gần đây</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {purchases.map((purchase) => (
          <div key={purchase.digest} className="bg-white rounded-xl p-5 space-y-4 hover:shadow-lg transition-shadow border border-slate-200">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-slate-800 font-bold line-clamp-1">{purchase.title}</h4>
                <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <Clock className="w-3 h-3" />
                  {new Date(purchase.createdAt).toLocaleDateString()}
                </div>
              </div>
              <a
                href={purchase.accessUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary rounded-lg transition-colors shrink-0 border border-brand-primary/20"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                  <Hash className="w-3 h-3" /> Tx Digest
                </span>
                <span className="text-brand-primary font-mono truncate max-w-[150px]">{purchase.digest}</span>
              </div>
              <p className="text-[11px] text-emerald-600 font-medium bg-emerald-50 p-1.5 rounded-md">
                {purchase.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
