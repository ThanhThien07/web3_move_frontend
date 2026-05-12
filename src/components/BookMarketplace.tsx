import { useMemo, useState, useEffect, type FormEvent } from 'react';
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { type BookItem, searchBooks } from '../books-api';
import { getPaymentConfig, MIST_PER_SUI } from '../payment-config';
import { buildPaymentTx, parsePaymentResult } from '../payment-tx';
import { requestBookFulfillment } from '../fulfillment-api';

type PurchaseRecord = {
	bookId: string;
	title: string;
	digest: string;
	accessUrl: string;
	fulfillmentMessage: string;
	createdAt: string;
};

const PURCHASES_STORAGE_KEY = 'book-marketplace.recentPurchases';

function formatMistToToken(mist: bigint, tokenName: string) {
	const whole = mist / MIST_PER_SUI;
	const frac = (mist % MIST_PER_SUI).toString().padStart(9, '0').replace(/0+$/, '');
	return frac ? `${whole}.${frac} ${tokenName}` : `${whole} ${tokenName}`;
}

function loadRecentPurchases(): PurchaseRecord[] {
	try {
		const raw = localStorage.getItem(PURCHASES_STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw) as PurchaseRecord[];
		return parsed.slice(0, 8);
	} catch {
		return [];
	}
}

function saveRecentPurchases(records: PurchaseRecord[]) {
	localStorage.setItem(PURCHASES_STORAGE_KEY, JSON.stringify(records.slice(0, 8)));
}

export default function BookMarketplace() {
	const account = useCurrentAccount();
	const client = useSuiClient();
	const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

	const [query, setQuery] = useState('blockchain');
	const [loading, setLoading] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [books, setBooks] = useState<BookItem[]>([]);
	const [busyBookId, setBusyBookId] = useState<string | null>(null);
	const [actionMessage, setActionMessage] = useState<string | null>(null);
	const [lastAccessUrl, setLastAccessUrl] = useState<string | null>(null);
	const [recentPurchases, setRecentPurchases] = useState<PurchaseRecord[]>(() => loadRecentPurchases());

	const paymentConfig = useMemo(() => {
		try {
			return getPaymentConfig();
		} catch {
			return null;
		}
	}, []);

	const configError = useMemo(() => {
		if (!paymentConfig) {
			return 'Missing or invalid payment configuration.';
		}
		return null;
	}, [paymentConfig]);

	useEffect(() => {
		if (paymentConfig) {
			handleSearch();
		}
	}, [paymentConfig]);

	async function handleSearch(event?: FormEvent) {
		event?.preventDefault();
		setLoadError(null);
		setActionMessage(null);
		setLoading(true);
		try {
			if (!paymentConfig) throw new Error('Payment configuration is not ready.');
			const result = await searchBooks(query, paymentConfig);
			setBooks(result);
			setLastAccessUrl(null);
		} catch (error) {
			setLoadError(error instanceof Error ? error.message : String(error));
			setBooks([]);
		} finally {
			setLoading(false);
		}
	}

	async function handleBuy(book: BookItem) {
		if (!account) {
			setActionMessage('Please connect wallet before purchasing.');
			return;
		}
		if (configError || !paymentConfig) {
			setActionMessage(configError ?? 'Invalid payment configuration.');
			return;
		}

		const config = paymentConfig;
		setBusyBookId(book.id);
		setActionMessage(null);
		try {
			const tx = await buildPaymentTx(
				config,
				book.priceMist,
				client,
				account.address,
				book.id
			);
			
			const result = await signAndExecuteTransaction({ 
				transaction: tx,
			});
			
			const digest = result.digest;
			await client.waitForTransaction({ digest });
			
			const fulfillment = await requestBookFulfillment({
				config,
				book,
				walletAddress: account.address,
				digest,
			});

			const record: PurchaseRecord = {
				bookId: book.id,
				title: book.title,
				digest: digest,
				accessUrl: fulfillment.accessUrl,
				fulfillmentMessage: fulfillment.message,
				createdAt: new Date().toISOString(),
			};
			const updated = [record, ...recentPurchases];
			setRecentPurchases(updated);
			saveRecentPurchases(updated);

			setLastAccessUrl(fulfillment.accessUrl);
			setActionMessage(`Payment successful. ${fulfillment.message}`);
		} catch (error) {
			setActionMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setBusyBookId(null);
		}
	}

	return (
		<section className="app-card space-y-4 p-4 sm:p-5">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<h2 className="text-base font-semibold text-slate-100 sm:text-lg">Book marketplace</h2>
				<span className="rounded-full border border-cyan-400/45 bg-cyan-500/15 px-2 py-1 text-xs font-medium text-cyan-200">
					Pay with {paymentConfig?.tokenName ?? 'library token'}
				</span>
			</div>
			{configError ? (
				<p className="rounded-lg border border-rose-400/40 bg-rose-500/15 p-3 text-sm text-rose-200">
					Configuration error: {configError}
				</p>
			) : null}

			<form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleSearch}>
				<input
					className="w-full rounded-lg border border-slate-500/70 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400"
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder="Search books (e.g. solidity, move, defi)"
				/>
				<button
					type="submit"
					className="w-full rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-50 sm:w-auto"
					disabled={loading || !!configError}
				>
					{loading ? 'Searching...' : 'Search'}
				</button>
			</form>

			{loadError ? (
				<p className="rounded-lg border border-rose-400/40 bg-rose-500/15 p-3 text-sm text-rose-200">
					{loadError}
				</p>
			) : null}

			<div className="grid gap-3 sm:grid-cols-2">
				{books.map((book) => (
					<article
						key={book.id}
						className="rounded-xl border border-slate-600/70 bg-slate-900/50 p-3 text-slate-100"
					>
						{book.coverUrl ? (
							<img
								src={book.coverUrl}
								alt={book.title}
								className="h-40 w-full rounded-md object-cover"
								loading="lazy"
							/>
						) : (
							<div className="flex h-40 w-full items-center justify-center rounded-md bg-slate-800 text-xs text-slate-400">
								No cover image
							</div>
						)}
						<h3 className="mt-3 line-clamp-2 text-sm font-semibold">{book.title}</h3>
						<p className="mt-1 text-xs text-slate-300">by {book.author}</p>
						<div className="mt-3 flex items-center justify-between gap-2">
							<p className="text-sm font-semibold text-cyan-300">
						{formatMistToToken(book.priceMist, paymentConfig?.tokenName ?? 'token')}
					</p>
							<button
								type="button"
								className="rounded-lg bg-teal-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-400 disabled:opacity-50"
								disabled={!account || busyBookId === book.id || !!configError}
								onClick={() => void handleBuy(book)}
							>
								{busyBookId === book.id ? `Processing ${paymentConfig?.tokenName ?? 'token'}...` : `Redeem with ${paymentConfig?.tokenName ?? 'token'}`}
							</button>
						</div>
					</article>
				))}
			</div>

			{books.length === 0 && !loading && !loadError ? (
				<p className="text-sm text-slate-300">No books loaded yet. Try searching keywords above.</p>
			) : null}

			{actionMessage ? (
				<p className="rounded-lg border border-slate-500/60 bg-slate-900/60 p-3 text-sm text-slate-200">
					{actionMessage}
				</p>
			) : null}
			{lastAccessUrl ? (
				<a
					href={lastAccessUrl}
					target="_blank"
					rel="noreferrer"
					className="inline-flex rounded-lg border border-cyan-400/45 bg-cyan-500/15 px-3 py-2 text-sm font-semibold text-cyan-200"
				>
					Open your latest book access link
				</a>
			) : null}

			<div className="space-y-2">
				<h3 className="text-sm font-semibold text-slate-100">Recent purchases</h3>
				{recentPurchases.length === 0 ? (
					<p className="text-xs text-slate-400">No purchases yet.</p>
				) : (
					<ul className="space-y-2">
						{recentPurchases.map((item) => (
							<li
								key={`${item.digest}-${item.bookId}`}
								className="rounded-lg border border-slate-600/60 bg-slate-900/50 p-2 text-xs text-slate-300"
							>
								<p className="font-medium text-slate-100">{item.title}</p>
								<p className="mt-1 text-[11px] text-cyan-300">{item.fulfillmentMessage}</p>
								<p className="mt-1 break-all font-mono">{item.digest}</p>
								<a href={item.accessUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block underline">
									Open access link
								</a>
							</li>
						))}
					</ul>
				)}
			</div>
		</section>
	);
}
