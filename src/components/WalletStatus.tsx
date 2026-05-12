import { useCurrentAccount, useCurrentClient, useCurrentWallet, useCurrentNetwork } from '@mysten/dapp-kit-react';
import { useEffect, useState } from 'react';
import { DEFAULT_SUI_COIN_TYPE, MIST_PER_SUI, getPaymentConfig } from '../payment-config';

function WalletStatus() {
	const account = useCurrentAccount();
	const client = useCurrentClient();
	const wallet = useCurrentWallet();
	const network = useCurrentNetwork();
	const [balanceText, setBalanceText] = useState<string>('—');
	const [targetCoinType, setTargetCoinType] = useState<string>(DEFAULT_SUI_COIN_TYPE);

	useEffect(() => {
		try {
			const config = getPaymentConfig();
			setTargetCoinType(config.coinType);
		} catch {
			setTargetCoinType(DEFAULT_SUI_COIN_TYPE);
		}
	}, []);

	useEffect(() => {
		if (!account) {
			return;
		}
		let cancelled = false;
		void client
			.getBalance({ owner: account.address, coinType: targetCoinType })
			.then((response) => {
				if (cancelled) return;
				const amount = BigInt(response.balance.balance);
				const whole = amount / MIST_PER_SUI;
				const frac = (amount % MIST_PER_SUI).toString().padStart(9, '0').replace(/0+$/, '');
				setBalanceText(frac ? `${whole}.${frac}` : `${whole}`);
			})
			.catch(() => {
				if (cancelled) return;
				setBalanceText('N/A');
			});
		return () => {
			cancelled = true;
		};
	}, [account, client, targetCoinType]);

	if (!account) {
		return (
			<section className="app-card p-4 sm:p-5">
				<p className="text-sm text-slate-200">Connect your wallet to get started.</p>
			</section>
		);
	}

	const shortAddress = `${account.address.slice(0, 6)}...${account.address.slice(-4)}`;

	return (
		<section className="app-card space-y-3 p-4 sm:p-5">
			<div className="flex items-center justify-between gap-2">
				<h2 className="text-base font-semibold text-slate-100 sm:text-lg">Wallet status</h2>
				<span className="rounded-full border border-emerald-400/45 bg-emerald-400/15 px-2 py-1 text-xs font-medium text-emerald-200">
					Connected
				</span>
			</div>
			<div className="grid gap-2 text-sm text-slate-200 sm:grid-cols-4">
				<p className="rounded-lg border border-slate-600/60 bg-slate-900/60 px-3 py-2">
					<span className="block text-xs uppercase tracking-wider text-slate-400">Wallet</span>
					<span className="mt-1 block truncate font-medium">{wallet?.name ?? 'Unknown'}</span>
				</p>
				<p className="rounded-lg border border-slate-600/60 bg-slate-900/60 px-3 py-2">
					<span className="block text-xs uppercase tracking-wider text-slate-400">Address</span>
					<span className="mt-1 block font-mono text-xs sm:hidden">{shortAddress}</span>
					<span className="mt-1 hidden break-all font-mono text-xs sm:block">{account.address}</span>
				</p>
				<p className="rounded-lg border border-slate-600/60 bg-slate-900/60 px-3 py-2">
					<span className="block text-xs uppercase tracking-wider text-slate-400">Network</span>
					<span className="mt-1 block font-medium">{network}</span>
				</p>
				<p className="rounded-lg border border-slate-600/60 bg-slate-900/60 px-3 py-2">
					<span className="block text-xs uppercase tracking-wider text-slate-400">Balance</span>
					<span className="mt-1 block font-medium">
						{balanceText} {targetCoinType === DEFAULT_SUI_COIN_TYPE ? 'SUI' : targetCoinType}
					</span>
				</p>
			</div>
		</section>
	);
}

export default WalletStatus;