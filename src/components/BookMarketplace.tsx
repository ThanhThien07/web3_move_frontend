import { type FormEvent, useEffect, useState } from 'react';
import { useMarketplace } from '../lib/useMarketplace';
import { MIST_PER_SUI } from '../lib/payment-config';
import { toast } from 'sonner';
import { useCurrentAccount } from '@mysten/dapp-kit';

function formatMistToToken(mist: bigint, tokenName: string) {
	const whole = mist / MIST_PER_SUI;
	const frac = (mist % MIST_PER_SUI).toString().padStart(9, '0').replace(/0+$/, '');
	return frac ? `${whole}.${frac} ${tokenName}` : `${whole} ${tokenName}`;
}

export default function BookMarketplace() {
	const account = useCurrentAccount();
	const {
		query,
		setQuery,
		books,
		loading,
		loadError,
		busyBookId,
		recentPurchases,
		handleSearch,
		buyBook,
		paymentConfig
	} = useMarketplace();

	const [actionMessage, setActionMessage] = useState<string | null>(null);

	useEffect(() => {
		if (paymentConfig) {
			handleSearch();
		}
	}, [paymentConfig, handleSearch]);

	const onSearch = (e: FormEvent) => {
		e.preventDefault();
		handleSearch();
	};

	const onBuy = async (book: any) => {
		try {
			const fulfillment = await buyBook(book);
			toast.success(`Success! ${fulfillment.message}`);
			setActionMessage(`Access Link: ${fulfillment.accessUrl}`);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : String(error));
		}
	};

	return (
		<section className="bg-white rounded-2xl shadow-sm border border-slate-100 space-y-6 p-6 sm:p-8">
			<header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h2 className="text-2xl font-black text-slate-800">Explore Library</h2>
					<p className="text-sm text-slate-500">Discover premium books on the Sui blockchain</p>
				</div>
				
				<form onSubmit={onSearch} className="flex gap-2">
					<input
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search books..."
						className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm w-full md:w-64"
					/>
					<button
						type="submit"
						disabled={loading}
						className="primary-button whitespace-nowrap"
					>
						{loading ? 'Searching...' : 'Search'}
					</button>
				</form>
			</header>

			{loadError && (
				<div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm flex items-center gap-3">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
					{loadError}
				</div>
			)}

			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{books.map((book) => (
					<article
						key={book.id}
						className="group relative flex flex-col bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:border-emerald-100 transition-all duration-300"
					>
						<div className="aspect-[4/5] w-full overflow-hidden bg-slate-50">
							{book.coverUrl ? (
								<img
									src={book.coverUrl}
									alt={book.title}
									className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
								/>
							) : (
								<div className="flex h-full w-full items-center justify-center text-slate-300">
									<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
								</div>
							)}
						</div>

						<div className="p-5 flex flex-col flex-grow">
							<h3 className="text-base font-bold text-slate-800 line-clamp-2 leading-tight mb-1">{book.title}</h3>
							<p className="text-xs font-medium text-slate-400 mb-4">by {book.author}</p>
							
							<div className="mt-auto flex items-center justify-between gap-3 pt-4 border-t border-slate-50">
								<div className="flex flex-col">
									<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Price</span>
									<span className="text-lg font-black text-emerald-600">
										{formatMistToToken(book.priceMist, paymentConfig?.tokenName ?? 'SUI')}
									</span>
								</div>
								
								<button
									type="button"
									disabled={!account || busyBookId === book.id}
									onClick={() => void onBuy(book)}
									className="primary-button h-10 px-4 text-xs font-bold shadow-md shadow-emerald-500/10"
								>
									{busyBookId === book.id ? 'Buying...' : 'Redeem Now'}
								</button>
							</div>
						</div>
					</article>
				))}
			</div>

			{books.length === 0 && !loading && !loadError && (
				<div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl">
					<p className="text-slate-400 font-medium">No books found. Try a different search.</p>
				</div>
			)}

			{recentPurchases.length > 0 && (
				<div className="pt-8 border-t border-slate-100 space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Recent Purchases</h3>
						<span className="h-px flex-grow mx-4 bg-slate-100"></span>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						{recentPurchases.map((item) => (
							<div
								key={`${item.digest}-${item.bookId}`}
								className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all group"
							>
								<div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
								</div>
								<div className="flex flex-col min-w-0">
									<span className="text-sm font-bold text-slate-800 truncate">{item.title}</span>
									<span className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-tighter">Transaction: {item.digest.slice(0, 10)}...</span>
									<a 
										href={item.accessUrl} 
										target="_blank" 
										rel="noreferrer" 
										className="mt-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
									>
										Open Access
										<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
									</a>
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</section>
	);
}
