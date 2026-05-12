import { useCurrentAccount, useSuiClient, useCurrentWallet, useSuiClientContext, useAccounts, useSwitchAccount } from '@mysten/dapp-kit';
import { useEffect, useState } from 'react';
import { DEFAULT_SUI_COIN_TYPE, MIST_PER_SUI, getPaymentConfig } from '../lib/payment-config';

function WalletStatus() {
	const account = useCurrentAccount();
	const accounts = useAccounts();
	const { mutate: switchAccount } = useSwitchAccount();
	const client = useSuiClient();
	const wallet = useCurrentWallet();
	const { network } = useSuiClientContext();
	const [suiBalance, setSuiBalance] = useState<string>('—');
	const [tokenBalance, setTokenBalance] = useState<string>('—');
	const [tokenName, setTokenName] = useState<string>('Token');
	const [targetCoinType, setTargetCoinType] = useState<string>(DEFAULT_SUI_COIN_TYPE);
	const [showAccountList, setShowAccountList] = useState(false);

	useEffect(() => {
		try {
			const config = getPaymentConfig();
			setTargetCoinType(config.coinType);
			setTokenName(config.tokenName);
		} catch {
			setTargetCoinType(DEFAULT_SUI_COIN_TYPE);
			setTokenName('Token');
		}
	}, []);

	const fetchBalances = async () => {
		if (!account) return;
		
		try {
			// Fetch SUI Balance
			const suiResponse = await client.getBalance({ owner: account.address, coinType: DEFAULT_SUI_COIN_TYPE });
			const suiAmount = BigInt(suiResponse.totalBalance);
			const suiWhole = suiAmount / MIST_PER_SUI;
			const suiFrac = (suiAmount % MIST_PER_SUI).toString().padStart(9, '0').replace(/0+$/, '');
			setSuiBalance(suiFrac ? `${suiWhole}.${suiFrac}` : `${suiWhole}`);

			// Fetch Token Balance if different from SUI
			if (targetCoinType !== DEFAULT_SUI_COIN_TYPE) {
				const tokenResponse = await client.getBalance({ owner: account.address, coinType: targetCoinType });
				const tokenAmount = BigInt(tokenResponse.totalBalance);
				const tokenWhole = tokenAmount / MIST_PER_SUI;
				const tokenFrac = (tokenAmount % MIST_PER_SUI).toString().padStart(9, '0').replace(/0+$/, '');
				setTokenBalance(tokenFrac ? `${tokenWhole}.${tokenFrac}` : `${tokenWhole}`);
			} else {
				setTokenBalance('');
			}
		} catch (err) {
			console.error('Balance fetch failed', err);
		}
	};

	useEffect(() => {
		fetchBalances();
		const interval = setInterval(fetchBalances, 15000); // Refresh every 15s
		return () => clearInterval(interval);
	}, [account, client, targetCoinType]);

	if (!account) {
		return (
			<section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center">
				<p className="text-sm text-slate-500">Please connect your Sui wallet to view your library status.</p>
			</section>
		);
	}

	const shortAddress = (addr: string) => `${addr.slice(0, 8)}...${addr.slice(-6)}`;

	return (
		<section className="bg-white rounded-2xl shadow-sm border border-slate-100 space-y-5 p-5 sm:p-7">
			<div className="flex items-center justify-between gap-4">
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-3">
						<h2 className="text-xl font-extrabold text-slate-900">Wallet Dashboard</h2>
						<span className="rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-indigo-600 border border-indigo-100 shadow-sm">
							{network}
						</span>
					</div>
					<p className="text-xs text-slate-400 font-medium">Manage your accounts and check balances</p>
				</div>
				<button 
					onClick={() => setShowAccountList(!showAccountList)}
					className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 active:scale-95"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
					{accounts.length > 1 ? `Accounts (${accounts.length})` : 'Account'}
				</button>
			</div>

			{showAccountList && (
				<div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
					<div className="flex items-center justify-between">
						<p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Available Wallets</p>
						<button onClick={() => setShowAccountList(false)} className="text-slate-400 hover:text-slate-600">
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
						</button>
					</div>
					<div className="grid gap-2.5">
						{accounts.map((acc) => (
							<button
								key={acc.address}
								onClick={() => {
									switchAccount({ account: acc });
									setShowAccountList(false);
								}}
								className={`flex items-center justify-between rounded-xl px-5 py-4 text-left transition-all duration-200 ${
									acc.address === account.address 
										? 'bg-white shadow-md ring-2 ring-indigo-500/10 translate-x-1' 
										: 'bg-white/40 hover:bg-white hover:shadow-sm'
								}`}
							>
								<div className="flex items-center gap-4">
									<div className={`h-10 w-10 rounded-full flex items-center justify-center text-lg ${acc.address === account.address ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
										{acc.label ? acc.label[0].toUpperCase() : 'S'}
									</div>
									<div className="flex flex-col">
										<span className={`text-sm font-bold ${acc.address === account.address ? 'text-slate-900' : 'text-slate-600'}`}>
											{acc.label || 'Sui Account'}
										</span>
										<span className="font-mono text-[10px] text-slate-400 tracking-tight">{acc.address}</span>
									</div>
								</div>
								{acc.address === account.address && (
									<div className="flex items-center gap-2">
										<span className="text-[10px] font-bold text-indigo-600 uppercase">Active</span>
										<div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
									</div>
								)}
							</button>
						))}
					</div>
				</div>
			)}

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div className="group rounded-2xl border border-slate-100 bg-slate-50/40 p-5 transition-colors hover:bg-white hover:border-indigo-100">
					<span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-indigo-400 transition-colors">Connected As</span>
					<div className="mt-3 flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm">
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
						</div>
						<div className="flex flex-col">
							<span className="text-xs font-bold text-slate-800">{wallet.currentWallet?.name ?? 'Sui Wallet'}</span>
							<span className="font-mono text-[11px] font-medium text-slate-500">{shortAddress(account.address)}</span>
						</div>
					</div>
				</div>

				<div className="group rounded-2xl border border-slate-100 bg-slate-50/40 p-5 transition-colors hover:bg-white hover:border-emerald-100">
					<span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-emerald-500 transition-colors">SUI Balance</span>
					<div className="mt-3 flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
						</div>
						<div className="flex flex-col">
							<span className="text-lg font-black text-slate-900 leading-none">{suiBalance}</span>
							<span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Native Token</span>
						</div>
					</div>
				</div>

				{tokenBalance !== '' && (
					<div className="group rounded-2xl border border-slate-100 bg-slate-50/40 p-5 transition-colors hover:bg-white hover:border-amber-100">
						<span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-amber-500 transition-colors">{tokenName} Balance</span>
						<div className="mt-3 flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shadow-sm">
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/></svg>
							</div>
							<div className="flex flex-col">
								<span className="text-lg font-black text-slate-900 leading-none">{tokenBalance}</span>
								<span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Payment Token</span>
							</div>
						</div>
					</div>
				)}

				<div className="group rounded-2xl border border-slate-100 bg-slate-50/40 p-5 transition-colors hover:bg-white hover:border-rose-100">
					<span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-rose-500 transition-colors">Library Status</span>
					<div className="mt-3 flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100 shadow-sm">
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
						</div>
						<div className="flex flex-col">
							<span className="text-sm font-bold text-slate-800">Active Reader</span>
							<span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Verified Member</span>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}


export default WalletStatus;