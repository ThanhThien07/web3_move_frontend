import { SuiJsonRpcClient as SuiClient, type CoinStruct } from '@mysten/sui/jsonRpc';
import { Transaction } from '@mysten/sui/transactions';
import { DEFAULT_SUI_COIN_TYPE, type PaymentConfig } from './payment-config';

type ClientType = SuiClient;

const PAYMENT_GAS_BUDGET = 20_000_000n;

async function fetchAllTokenCoins(
	client: ClientType,
	owner: string,
	coinType: string,
): Promise<CoinStruct[]> {
	const coins: CoinStruct[] = [];
	let cursor: string | null = null;

	while (true) {
		const page = await client.getCoins({ owner, coinType, cursor, limit: 100 });
		coins.push(...page.data);
		if (!page.hasNextPage || !page.nextCursor) break;
		cursor = page.nextCursor;
	}

	return coins;
}

export async function buildPaymentTx(
	config: PaymentConfig,
	amountMist: bigint,
	client: ClientType,
	owner: string,
	bookId: string,
) {
	const tx = new Transaction();
	tx.setGasBudget(PAYMENT_GAS_BUDGET);

	if (config.coinType === DEFAULT_SUI_COIN_TYPE) {
		const [coin] = tx.splitCoins(tx.gas, [amountMist]);
		
		if (config.packageId && config.packageId !== '0x_PLACEHOLDER_PACKAGE_ID') {
			const ticket = tx.moveCall({
				target: `${config.packageId}::web3::buy_ticket`,
				arguments: [
					tx.object(config.libraryId),
					coin,
					tx.pure.string(bookId)
				],
			});
			tx.transferObjects([ticket], owner);
		} else {
			tx.transferObjects([coin], config.receiver);
		}
		
		return tx;
	}

	const coins = await fetchAllTokenCoins(client, owner, config.coinType);
	if (coins.length === 0) {
		throw new Error(`No token coins found for ${config.coinType}.`);
	}

	const exactCoin = coins.find((coin) => BigInt(coin.balance) >= amountMist);
	if (exactCoin) {
		const [coin] = tx.splitCoins(tx.object(exactCoin.coinObjectId), [amountMist]);
		tx.transferObjects([coin], config.receiver);
		return tx;
	}

	const sorted = [...coins].sort((a, b) => {
		const balA = BigInt(a.balance);
		const balB = BigInt(b.balance);
		if (balA > balB) return -1;
		if (balA < balB) return 1;
		return 0;
	});
	let total = 0n;
	const selected: CoinStruct[] = [];
	for (const coin of sorted) {
		selected.push(coin);
		total += BigInt(coin.balance);
		if (total >= amountMist) break;
	}

	if (total < amountMist) {
		throw new Error(`Insufficient ${config.coinType} tokens: required ${amountMist}, available ${total}.`);
	}

	const [primary, ...sources] = selected;
	if (sources.length > 0) {
		tx.mergeCoins(primary.coinObjectId, sources.map((coin) => coin.coinObjectId));
	}

	const [coin] = tx.splitCoins(tx.object(primary.coinObjectId), [amountMist]);
	tx.transferObjects([coin], config.receiver);
	return tx;
}

export function parsePaymentResult(result: any) {
	return {
		digest: result.digest,
		status: result.status,
		effects: result.effects,
	};
}
