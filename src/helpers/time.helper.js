export function toDecimalFormat(ms) {
	return Number(ms / (1000 * 60 * 60)).toFixed(2);
}
