import { Transaction } from '@mysten/sui/transactions';

const MODULE_NAME = 'web3';
const GAS_BUDGET = 10_000_000n;

export function buildNewGreetingTx(packageId: string) {
	const tx = new Transaction();
	tx.setGasBudget(GAS_BUDGET);
	tx.moveCall({
		target: `${packageId}::${MODULE_NAME}::new`,
		arguments: [],
	});
	return tx;
}

export function buildUpdateGreetingTextTx(packageId: string, greetingObjectId: string, newText: string) {
	const tx = new Transaction();
	tx.setGasBudget(GAS_BUDGET);
	tx.moveCall({
		target: `${packageId}::${MODULE_NAME}::update_text`,
		arguments: [tx.object(greetingObjectId), tx.pure.string(newText)],
	});
	return tx;
}
