import { duration } from 'moment';
import 'moment-duration-format';

//type TimeFormat = 'HH:mm:ss' | 'HH:mm' | 'h.hh';
export const TIME_DURATION_MAX_SECONDS = 3596400;

export function parseTimeEntryDuration(input, format) {
	return parseTime(getSecondsFromInput(input, format), format, 'second');
}

export function parseTime(input, outputFormat, unit) {
	if (!outputFormat) outputFormat = 'HH:mm:ss';
	if (input == undefined) return;

	if (outputFormat === 'h.hh') {
		const timeInHours = duration(input, unit).asHours();
		const roundedTime = Math.round(timeInHours * 100) / 100;
		return roundedTime.toFixed(2);
	}

	return duration(input, unit).format(outputFormat, { trim: false });
}

export function numberFormatParse(value, format) {
	const defaultNumberFormat = 'COMMA_PERIOD';

	if (typeof value === 'number') return value.toString();

	const decimalSeparators = {
		COMMA: ',',
		PERIOD: '.',
	};
	const numberFormat = format || defaultNumberFormat;
	const decimalSeparator =
		decimalSeparators[
			numberFormat.substring(numberFormat.lastIndexOf('_') + 1)
		];

	if (decimalSeparator === '.') {
		return value.replace(/[,' ]/g, '');
	} else if (decimalSeparator === ',') {
		return value.replace(/[.' ]/g, '').replace(',', '.');
	}
}

export function getSecondsFromInput(input, format = 'HH:mm:ss') {
	if (!input) return 0;

	input = input
		.replace(',', '.')
		.replace('H', 'h')
		.replace('M', 'm')
		.replace('S', 's');

	const seconds = getSeconds(input, format);

	return seconds > TIME_DURATION_MAX_SECONDS
		? TIME_DURATION_MAX_SECONDS
		: seconds;
}

export function getUnmutatedSecondsFromInput(input, format = 'HH:mm:ss') {
	if (!input) return 0;

	input = input
		.replace(',', '.')
		.replace('H', 'h')
		.replace('M', 'm')
		.replace('S', 's');

	const seconds = getSeconds(input, format);

	return seconds;
}

export function getSeconds(input, format = 'HH:mm:ss') {
	if (input.includes('h') || input.includes('m') || input.includes('s')) {
		input = input.replace('PT', '');
		input = input.split(/(.*?[h\\/m\\s])/);

		return getSecondsFromTime([
			inputInclude(input, 'h'),
			inputInclude(input, 'm'),
			inputInclude(input, 's'),
		]);
	}

	if (input.includes(':') || input.includes(';') || input.includes('-')) {
		const time = input.split(/[:\\/;\\-]/);

		return getSecondsFromTime(time);
	}

	return getSecondsFromNumber(input, format);
}

function inputInclude(input, unit) {
	return input.filter((e) => e.includes(unit))[0]
		? input.filter((e) => e.includes(unit))[0].split(unit)[0]
		: '0';
}

function getSecondsFromNumber(input, format) {
	if (isNaN(Number(input))) return;

	if (Number(input) < 100 && format !== 'h.hh' && !input.includes('.')) {
		return Number(input) * 60;
	}

	if (input < 100 && format === 'h.hh') {
		return Number(input) * 3600;
	}

	input = input.toString();
	input = input.split('.');

	if (input[0] < 100) {
		return Number(input[0] + '.' + input[1]) * 3600;
	}

	const hours = input[0].substring(0, input[0].length - 2);
	const minutes = input[0].substring(input[0].length - 2, input[0].length);

	return (
		Number(hours) * 3600 +
		Number(minutes) * 60 +
		(input[1] ? Number('0.' + input[1]) * 60 : 0)
	);
}

function getSecondsFromTime(time) {
	const multiplier = [3600, 60, 1];
	let seconds = 0;
	for (let i = time.length - 1; i >= 0; i--) {
		if (isNaN(Number(time[i]))) return;
		seconds += Number(time[i]) * multiplier[i];
	}

	return seconds;
}

export function calculateSecondsFromTimeEntryDuration(timeEntryDuration) {
	return duration(timeEntryDuration, 'hour').asSeconds();
}

export function isTimeIntervalValid(timeEntryDuration) {
	return (
		duration(timeEntryDuration, 'hour').asSeconds() <= TIME_DURATION_MAX_SECONDS
	);
}

export function isTimeIntervalMaxSeconds(timeEntryDuration) {
	return (
		duration(timeEntryDuration, 'hour').asSeconds() ===
		TIME_DURATION_MAX_SECONDS
	);
}
