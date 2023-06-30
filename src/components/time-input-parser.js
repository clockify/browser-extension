import * as moment from 'moment';
import 'moment-duration-format';

export function parseTimeEntryDuration(input, format) {
	if (!format) {
		format = 'HH:mm:ss';
	}

	if (input) {
		input = input.replace(',', '.');

		if (input.includes('.0')) {
			input =
				input.split('.0')[1].length == 0 ? input.replace('.0', 'h') : input;
		}

		const timeDurationData = input.split(/[:/;-]/);
		if (timeDurationData.length === 1) {
			return calculateHoursOrMinutes(timeDurationData[0], format);
		} else if (timeDurationData.length === 2) {
			return calculateHoursAndMinutes(timeDurationData, format);
		} else if (timeDurationData.length === 3) {
			return calculateHoursMinutesAndSeconds(timeDurationData, format);
		}
	}
}

function calculateHoursOrMinutes(timeDuration, format) {
	if (timeDuration.charAt(timeDuration.length - 1).toLowerCase() === 'h') {
		return calculateHours(
			timeDuration.substring(0, timeDuration.length - 1),
			format
		);
	} else if (
		timeDuration.charAt(timeDuration.length - 1).toLowerCase() === 'm'
	) {
		return calculateMinutes(
			timeDuration.substring(0, timeDuration.length - 1),
			format
		);
	} else if (
		timeDuration.charAt(timeDuration.length - 1).toLowerCase() === 's'
	) {
		return calculateSeconds(
			timeDuration.substring(0, timeDuration.length - 1),
			format
		);
	} else {
		return calculateMinutesNumberOnly(timeDuration, format);
	}
}

function calculateHours(timeDuration, format) {
	timeDuration = timeDuration.replace(',', '.');

	const hoursFromData = Number(timeDuration);

	if (!isNaN(hoursFromData)) {
		if (hoursFromData >= 999) {
			return '999:00:00';
		} else {
			const hoursResult = Math.floor(hoursFromData);
			const minutesResult = Math.round(
				(((hoursFromData * 100) % 100) / 100) * 60
			);

			return setTimeEntryDurationDisplay(hoursResult, minutesResult, 0, format);
		}
	}
}

function calculateMinutes(timeDuration, format) {
	timeDuration = timeDuration.replace(',', '.');
	const minutesFromData = Number(timeDuration);
	if (!isNaN(minutesFromData)) {
		let hoursResult = Math.floor(minutesFromData / 60);
		let minutesResult;
		let secondsResult;
		if (hoursResult >= 999) {
			hoursResult = 999;
			minutesResult = 0;
			secondsResult = 0;
		} else {
			minutesResult = Math.floor(minutesFromData - hoursResult * 60);
			secondsResult = Math.round((((minutesFromData * 100) % 100) / 100) * 60);
		}

		return setTimeEntryDurationDisplay(
			hoursResult,
			minutesResult,
			secondsResult,
			format
		);
	}
}

function calculateMinutesNumberOnly(timeDuration, format) {
	timeDuration = timeDuration.replace(',', '.');
	const minutesFromData = Number(timeDuration);
	if (!isNaN(minutesFromData)) {
		if (minutesFromData < 100) {
			if (minutesFromData.toString().includes('.')) {
				return calculateHours(minutesFromData.toString(), format);
			}

			return setMinutes(minutesFromData, format);
		} else {
			let convertedTimeDuration;
			if (!Number.isInteger(minutesFromData)) {
				const roundMinutes = minutesFromData.toFixed(2);
				const minutes = String(roundMinutes);
				convertedTimeDuration = `${minutes.substring(0, minutes.length - 5)}:
          ${minutes.substring(minutes.length - 5, minutes.length)}`;
			} else {
				convertedTimeDuration = `${timeDuration.substring(
					0,
					timeDuration.length - 2
				)}:
          ${timeDuration.substring(
						timeDuration.length - 2,
						timeDuration.length
					)}`;
			}

			return calculateHoursAndMinutes(convertedTimeDuration.split(':'), format);
		}
	}
}

function setMinutes(minutes, format) {
	const hoursResult = Math.floor(minutes / 60);
	const minutesResult = Math.floor(minutes - hoursResult * 60);
	const secondsResult = Math.round((((minutes * 100) % 100) / 100) * 60);

	return setTimeEntryDurationDisplay(
		hoursResult,
		minutesResult,
		secondsResult,
		format
	);
}

function calculateSeconds(timeDuration, format) {
	timeDuration = timeDuration.replace(',', '.');
	const secondsFromData = Number(timeDuration);
	if (!isNaN(secondsFromData)) {
		let hoursResult = Math.floor(secondsFromData / 3600);
		let minutesResult = Math.floor(secondsFromData / 60) - hoursResult * 60;
		let secondsResult = Math.round(
			secondsFromData - hoursResult * 3600 - minutesResult * 60
		);

		if (hoursResult >= 999) {
			hoursResult = 999;
			minutesResult = 0;
			secondsResult = 0;
		}

		return setTimeEntryDurationDisplay(
			hoursResult,
			minutesResult,
			secondsResult,
			format
		);
	}
}

function calculateHoursAndMinutes(timeDurationData, format) {
	let hours = Number(timeDurationData[0].replace(',', '.'));
	if (!isNaN(hours)) {
		let minutes = Number(timeDurationData[1].replace(',', '.'));
		if (!isNaN(minutes)) {
			minutes =
				Math.floor((((hours * 100) % 100) / 100) * 60) + Number(minutes);
			const seconds = Math.floor((((minutes * 100) % 100) / 100) * 60);
			if (minutes > 59) {
				hours = hours + Math.floor(minutes / 60);
				minutes = Math.floor(minutes - Math.floor(minutes / 60) * 60);
			}
			if (hours > 999) {
				return '999:00:00';
			} else {
				if (!Number.isInteger(hours)) {
					hours = Math.floor(hours);
				}
				if (!Number.isInteger(minutes)) {
					minutes = Math.floor(minutes);
				}

				return setTimeEntryDurationDisplay(hours, minutes, seconds, format);
			}
		}
	}
}

function calculateHoursMinutesAndSeconds(timeDurationData, format) {
	let hours = Number(timeDurationData[0].replace(',', '.'));
	if (!isNaN(hours)) {
		let minutes = Number(timeDurationData[1].replace(',', '.'));
		if (!isNaN(minutes)) {
			let seconds = Number(timeDurationData[2].replace(',', '.'));
			if (!isNaN(seconds)) {
				seconds = Math.floor(seconds);
				if (seconds > 59) {
					minutes = minutes + Math.floor(seconds / 60);
					seconds = seconds - Math.floor(seconds / 60) * 60;
				}
				if (minutes > 59) {
					hours = hours + Math.floor(minutes / 60);
					minutes =
						Math.floor((((hours * 100) % 100) / 100) * 60) +
						(minutes - Math.floor(minutes / 60) * 60);
				}
				if (hours > 999) {
					return '999:00:00';
				} else {
					if (!Number.isInteger(hours)) {
						hours = Math.floor(hours);
					}
					if (!Number.isInteger(minutes)) {
						minutes = Math.floor(minutes);
					}

					return setTimeEntryDurationDisplay(hours, minutes, seconds, format);
				}
			}
		}
	}
}

function setTimeEntryDurationDisplay(hours, minutes, seconds, format) {
	const timeEntryDuration = moment.duration({
		hour: hours,
		minute: minutes,
		second: seconds,
	});

	return timeEntryDuration.format(format, { trim: false });
}