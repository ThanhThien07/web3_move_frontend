import { useEffect, useState } from 'react';
import { useCurrentAccount, useCurrentClient, useDAppKit } from '@mysten/dapp-kit-react';
import type { SuiClientTypes } from '@mysten/sui/client';
import {
	clearPersistedGreetingObjectId,
	getConfiguredGreetingObjectId,
	persistGreetingObjectId,
} from '../sui-config';
import { loadGreetingDisplayState, pickCreatedSharedObjectId } from '../greeting-object';
import { buildNewGreetingTx, buildUpdateGreetingTextTx } from '../web3-tx';

function failedTransactionMessage(tx: SuiClientTypes.Transaction<{ effects: true }>): string {
	if (tx.status.success) return 'Unknown error';
	return tx.status.error?.message ?? 'Transaction failed';
}

export default function GreetingPanel() {
	const dAppKit = useDAppKit();
	const client = useCurrentClient();
	const account = useCurrentAccount();

	const packageId = import.meta.env.VITE_PACKAGE_ID?.trim() ?? '';

	const [greetingObjectId, setGreetingObjectId] = useState<string | null>(() =>
		getConfiguredGreetingObjectId(),
	);
	const [greetingText, setGreetingText] = useState<string | null>(null);
	const [draftText, setDraftText] = useState('');
	const [loadError, setLoadError] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [lastDigest, setLastDigest] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		void loadGreetingDisplayState(client, greetingObjectId).then((r) => {
			if (cancelled) return;
			setGreetingText(r.text);
			setLoadError(r.error);
		});
		return () => {
			cancelled = true;
		};
	}, [client, greetingObjectId]);

	const runTx = async (label: string, build: () => ReturnType<typeof buildNewGreetingTx>) => {
		if (!packageId) {
			setActionError('Set VITE_PACKAGE_ID in .env (published package on the same network as the app).');
			return;
		}
		setActionError(null);
		setBusy(true);
		setLastDigest(null);
		try {
			const tx = build();
			const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });
			if (result.$kind === 'FailedTransaction') {
				setActionError(`${label} failed: ${failedTransactionMessage(result.FailedTransaction)}`);
				return;
			}
			const digest = result.Transaction.digest;
			setLastDigest(digest);
			const effects = result.Transaction.effects;
			if (!effects) {
				setActionError(`${label} succeeded but effects were missing; cannot resolve new object ID.`);
				return;
			}
			if (label === 'Create greeting') {
				const createdId = pickCreatedSharedObjectId(effects);
				if (!createdId) {
					setActionError('Transaction succeeded but no created object was found in effects.');
					return;
				}
				persistGreetingObjectId(createdId);
				setGreetingObjectId(createdId);
			}
			await client.waitForTransaction({ result });
			if (label === 'Update greeting') {
				const id = greetingObjectId;
				if (id) {
					void loadGreetingDisplayState(client, id).then((r) => {
						setGreetingText(r.text);
						setLoadError(r.error);
					});
				}
			}
		} catch (e) {
			setActionError(e instanceof Error ? e.message : String(e));
		} finally {
			setBusy(false);
		}
	};

	if (!account) {
		return null;
	}

	return (
		<section className="app-card space-y-4 p-4 sm:space-y-5 sm:p-5">
			<div className="flex items-center justify-between gap-2">
				<h2 className="text-base font-semibold text-slate-100 sm:text-lg">Greeting contract</h2>
				<span className="rounded-full border border-indigo-400/40 bg-indigo-500/15 px-2 py-1 text-[11px] font-medium text-indigo-200">
					Shared object
				</span>
			</div>
			<p className="text-xs text-slate-300 sm:text-sm">
				Mobile flow: connect wallet, tap action, approve in wallet app, then return to browser.
			</p>
			{!packageId ? (
				<p className="rounded-lg border border-amber-300/40 bg-amber-500/15 p-3 text-sm text-amber-100">
					Add <code className="rounded bg-slate-900/70 px-1">VITE_PACKAGE_ID</code> to your{' '}
					<code className="rounded bg-slate-900/70 px-1">.env</code> file, then
					restart the dev server.
				</p>
			) : null}

			<div className="text-sm">
				<p className="text-slate-300">Greeting object ID</p>
				<p className="rounded-lg border border-slate-600/60 bg-slate-900/60 p-2 font-mono text-xs break-all">
					{greetingObjectId ?? '— (call Create to initialize a shared Greeting)'}
				</p>
			</div>

			<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
				<button
					type="button"
					className="w-full rounded-lg bg-indigo-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-50 sm:w-auto"
					disabled={busy || !packageId}
					onClick={() => void runTx('Create greeting', () => buildNewGreetingTx(packageId))}
				>
					{busy ? 'Processing...' : 'Create shared Greeting'}
				</button>
				{greetingObjectId && !import.meta.env.VITE_GREETING_OBJECT_ID?.trim() ? (
					<button
						type="button"
						className="w-full rounded-lg border border-slate-500/70 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 sm:w-auto"
						disabled={busy}
						onClick={() => {
							clearPersistedGreetingObjectId();
							setGreetingObjectId(null);
							setGreetingText(null);
							setLastDigest(null);
							setActionError(null);
							setLoadError(null);
						}}
					>
						Forget stored ID
					</button>
				) : null}
			</div>

			<div className="space-y-1">
				<p className="text-sm text-slate-300">On-chain text</p>
				<p className="min-h-11 rounded-lg border border-dashed border-slate-600/60 bg-slate-900/35 px-3 py-2 text-sm text-slate-100">
					{loadError ? (
						<span className="text-rose-300">{loadError}</span>
					) : greetingText !== null ? (
						greetingText
					) : greetingObjectId ? (
						'…'
					) : (
						'—'
					)}
				</p>
			</div>

			<div className="space-y-2">
				<label className="block text-sm text-slate-300" htmlFor="greeting-update">
					New greeting
				</label>
				<input
					id="greeting-update"
					className="w-full rounded-lg border border-slate-500/70 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400"
					value={draftText}
					onChange={(e) => setDraftText(e.target.value)}
					placeholder="Hello from React"
					disabled={busy || !greetingObjectId}
				/>
				<button
					type="button"
					className="w-full rounded-lg bg-teal-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-400 disabled:opacity-50 sm:w-auto"
					disabled={busy || !packageId || !greetingObjectId || !draftText.trim()}
					onClick={() =>
						void runTx('Update greeting', () =>
							buildUpdateGreetingTextTx(packageId, greetingObjectId!, draftText.trim()),
						)
					}
				>
					{busy ? 'Processing...' : 'Update on-chain'}
				</button>
			</div>

			{actionError ? (
				<p className="rounded-lg border border-rose-400/40 bg-rose-500/15 p-3 text-sm text-rose-200">
					{actionError}
				</p>
			) : null}
			{lastDigest ? (
				<div className="rounded-lg border border-slate-600/60 bg-slate-900/60 p-2 text-xs text-slate-300">
					<p>Last transaction</p>
					<p className="break-all font-mono">{lastDigest}</p>
				</div>
			) : null}
		</section>
	);
}
