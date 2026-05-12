import { useState, useEffect, useMemo, useCallback } from 'react';
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { type BookItem, searchBooks } from './books-api';
import { getPaymentConfig } from './payment-config';
import { buildPaymentTx, parsePaymentResult } from './payment-tx';
import { requestBookFulfillment } from './fulfillment-api';

export type PurchaseRecord = {
	bookId: string;
	title: string;
	digest: string;
	accessUrl: string;
	fulfillmentMessage: string;
	createdAt: string;
};

const PURCHASES_STORAGE_KEY = 'book-marketplace.recentPurchases';

export function useMarketplace() {
	const account = useCurrentAccount();
	const client = useSuiClient();
	const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

	const [query, setQuery] = useState('blockchain');
	const [loading, setLoading] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [books, setBooks] = useState<BookItem[]>([]);
	const [busyBookId, setBusyBookId] = useState<string | null>(null);
	const [actionMessage, setActionMessage] = useState<string | null>(null);
	const [recentPurchases, setRecentPurchases] = useState<PurchaseRecord[]>([]);

	const paymentConfig = useMemo(() => {
		try {
			return getPaymentConfig();
		} catch {
			return null;
		}
	}, []);

	useEffect(() => {
		const raw = localStorage.getItem(PURCHASES_STORAGE_KEY);
		if (raw) {
			try {
				setRecentPurchases(JSON.parse(raw));
			} catch {
				setRecentPurchases([]);
			}
		}
	}, []);

	const handleSearch = useCallback(async (searchQuery?: string) => {
		const targetQuery = searchQuery ?? query;
		setLoadError(null);
		setLoading(true);
		try {
			if (!paymentConfig) throw new Error('Payment configuration is not ready.');
			const result = await searchBooks(targetQuery, paymentConfig);
			setBooks(result);
		} catch (error) {
			setLoadError(error instanceof Error ? error.message : String(error));
			setBooks([]);
		} finally {
			setLoading(false);
		}
	}, [query, paymentConfig]);

	const buyBook = async (book: BookItem) => {
		if (!account) throw new Error('Please connect wallet.');
		if (!paymentConfig) throw new Error('Invalid config.');

		setBusyBookId(book.id);
		try {
			const tx = await buildPaymentTx(
				paymentConfig,
				book.priceMist,
				client,
				account.address,
				book.id
			);
			
			const result = await signAndExecuteTransaction({ transaction: tx });
			const digest = result.digest;
			await client.waitForTransaction({ digest });
			
			const fulfillment = await requestBookFulfillment({
				config: paymentConfig,
				book,
				walletAddress: account.address,
				digest,
			});

			const record: PurchaseRecord = {
				bookId: book.id,
				title: book.title,
				digest,
				accessUrl: fulfillment.accessUrl,
				fulfillmentMessage: fulfillment.message,
				createdAt: new Date().toISOString(),
			};
			
			const updated = [record, ...recentPurchases].slice(0, 10);
			setRecentPurchases(updated);
			localStorage.setItem(PURCHASES_STORAGE_KEY, JSON.stringify(updated));

			return fulfillment;
		} finally {
			setBusyBookId(null);
		}
	};

	return {
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
	};
}
