import moment, { duration } from 'moment';
import 'moment-duration-format';

export const NUMBER_FORMATS = {
	COMMA_PERIOD: 'COMMA_PERIOD',
	PERIOD_COMMA: 'PERIOD_COMMA',
	QUOTATION_MARK_PERIOD: 'QUOTATION_MARK_PERIOD',
	SPACE_COMMA: 'SPACE_COMMA',
};

export function timeFormatTransform(time, format) {
	class IntervalDuration {
		constructor(milisecondsOrIsoString) {
			this.durationInMiliseconds = this.convertToMiliseconds(
				milisecondsOrIsoString
			);
		}
		convertToMiliseconds(milisecondsOrIsoString) {
			if (!milisecondsOrIsoString) {
				return 0;
			}
			if (this.isNumeric(milisecondsOrIsoString)) {
				return Number(milisecondsOrIsoString);
			} else if (typeof milisecondsOrIsoString === 'string') {
				return moment.duration(milisecondsOrIsoString).asMilliseconds();
			} else {
				return 0;
			}
		}
		asString() {
			return this.convertToString(this.durationInMiliseconds);
		}

		convertToString(duration) {
			return moment.duration(duration).toISOString();
		}
	}

	if (typeof time == 'number') {
		const miliseconds = time * 1000;
		time = new IntervalDuration(miliseconds).asString();
	}

	return formatDuration(moment.duration(time), format);
}

function formatDuration(input, format) {
	if (!input) return;

	if (format === 'h.hh') {
		const timeInHours = duration(input).asHours();
		const roundedTime = Math.round(timeInHours * 100) / 100;
		return roundedTime.toFixed(2);
	}

	return duration(input).format(format || 'HH:mm:ss', { trim: false });
}

export function numberFormatTransform(value, format, timeFormat) {
	if (!value && value !== 0 && value !== '0') {
		return;
	}
	const defaultNumberFormat = NUMBER_FORMATS.COMMA_PERIOD;

	if (!value && value !== 0) return value.toString();

	if (/[a-zA-Z]/g.test(value.toString())) {
		return value.toString();
	}

	if (timeFormat && timeFormat !== 'h.hh') {
		return value.toString();
	}

	if ([',', '.'].includes(value.toString()[value.toString().length - 1])) {
		return value.toString();
	}

	let beforeDecimalSeparator;
	let afterDecimalSeparator;
	const formatRegex = /\B(?=(\d{3})+(?!\d))/g;
	const numberFormat = format || defaultNumberFormat;

	if (
		value === '—' ||
		value === '-' ||
		(typeof value === 'number' && isNaN(value))
	) {
		return value.toString();
	}

	switch (numberFormat) {
		case NUMBER_FORMATS.COMMA_PERIOD:
			beforeDecimalSeparator = ',';
			afterDecimalSeparator = '.';
			break;
		case NUMBER_FORMATS.PERIOD_COMMA:
			beforeDecimalSeparator = '.';
			afterDecimalSeparator = ',';
			break;
		case NUMBER_FORMATS.QUOTATION_MARK_PERIOD:
			beforeDecimalSeparator = "'";
			afterDecimalSeparator = '.';
			break;
		case NUMBER_FORMATS.SPACE_COMMA:
			beforeDecimalSeparator = ' ';
			afterDecimalSeparator = ',';
			break;
		default:
			break;
	}

	let formattedValue = value
		?.toString()
		?.replace(/,/g, '')
		?.replace(formatRegex, beforeDecimalSeparator);

	if (+value % 1 !== 0 || value?.toString()?.includes('.')) {
		const valueAfterDecimalIndex = value?.toString().lastIndexOf('.');
		formattedValue =
			value
				.toString()
				.substring(0, valueAfterDecimalIndex)
				?.replace(/,/g, '')
				.replace(formatRegex, beforeDecimalSeparator) +
			afterDecimalSeparator +
			value.toString().substring(valueAfterDecimalIndex + 1);
	}

	return formattedValue;
}
