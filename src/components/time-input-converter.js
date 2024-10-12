export function parseInput(totalTime) {
	if (totalTime.indexOf('.') > -1) {
		totalTime = formatDecimals(totalTime.toLowerCase());
	}

	let totalTimeNumber = Number(totalTime);

	if (isNaN(totalTimeNumber)) {
		if (isTimeValid(totalTime)) {
			return parseTimeWithSeparator(totalTime.toLowerCase());
		} else {
			return null;
		}
	} else if (totalTimeNumber % 1 === 0) {
		if (totalTime.length < 3) {
			let hours = Number(totalTime);
			if (hours > 24) {
				const minutes = hours % 10;
				hours = Math.floor(hours / 10);

				return `${hours}:${minutes}`;
			} else {
				return `${totalTime}:00`;
			}
		} else if (totalTime.length === 3) {
			let hours = totalTime.substring(0, 1);
			let minutes = totalTime.substring(1, 3);

			return `0${hours}${minutes}`;
		} else if (totalTime.length > 3) {
			if (totalTimeNumber < 2400) {
				let hours = totalTime.substring(0, 2);
				let minutes = totalTime.substring(2, 4);
				return `${hours}${minutes}`;
			} else {
				return null;
			}
		}
	} else {
		return null;
	}
}

function formatDecimals(totalTime) {
	let hours;
	let minutes;
	let rest = '';
	const totalTimeParts = totalTime.split('.');
	// eslint-disable-next-line prefer-const
	hours = totalTimeParts[0];

	if (/[0-9]{1,2}.[0-9]{1,2}(a|am|p|pm)/.test(totalTime)) {
		totalTimeParts[1] = totalTimeParts[1].replace('a', ' a');
		totalTimeParts[1] = totalTimeParts[1].replace('p', ' p');
		const minutesParts = totalTimeParts[1].split(' ');
		minutes = minutesParts[0].length == 1 ? '0'.concat(minutesParts[0]) : minutesParts[0];
		rest = minutesParts[1];
	} else {
		minutes = totalTimeParts[1].length == 1 ? '0'.concat(totalTimeParts[1]) : totalTimeParts[1];
	}

	return hours.concat(':').concat(minutes).concat(rest);
}

function isTimeValid(time) {
	let result = convertTotalTimeTo24HourDisplay(time);
	let fullTimeInput = Number(result) < 2460;
	let hourOnlyInput = Number(result) < 24;

	return result.length < 3 ? hourOnlyInput : fullTimeInput;
}

function parseTimeWithSeparator(totalTime) {
	if (
		/^\d\d:\d\d(a|p|am|pm)$/i.test(totalTime) ||
		/^\d:\d\d(a|p|am|pm)$/i.test(totalTime) ||
		/^\d\d:\d\d (a|p|am|pm)$/i.test(totalTime) ||
		/^\d:\d\d (a|p|am|pm)$/i.test(totalTime)
	) {
		let data = totalTime.split(':');
		let hours;
		let minutes = data[1].substring(0, 2);
		let numberOfHours = Number(data[0]);
		if (numberOfHours > 12) {
			return null;
		} else {
			if (isPM(totalTime) && numberOfHours !== 12) {
				hours = (numberOfHours + 12).toString();
			} else {
				hours = (isAM(totalTime) && numberOfHours === 12 ? 0 : numberOfHours).toString();
			}
			return parseTimeWithSeparatorWithoutString(`${hours}:${minutes}`);
		}
	} else if (/^\d{1,4}(a|p|am|pm)$/i.test(totalTime)) {
		let totalTimeWithoutLetters = totalTime
			.toLowerCase()
			.replace('a', '')
			.replace('p', '')
			.replace('m', '');
		let hours = '00';
		let minutes = '00';

		switch (totalTimeWithoutLetters.length) {
			case 1:
			case 2: {
				if (totalTime === '0' || totalTime === '00') {
					hours = '00';
				} else {
					let numberOfHours = Number(totalTimeWithoutLetters.substring(0, 2));
					if (numberOfHours > 12) {
						return null;
					}
					if (isPM(totalTime) && numberOfHours !== 12) {
						hours = (numberOfHours + 12).toString();
					} else {
						hours = (
							isAM(totalTime) && numberOfHours === 12 ? 0 : numberOfHours
						).toString();
					}
				}
				break;
			}
			case 3: {
				let numberOfHours = Number(totalTimeWithoutLetters.substring(0, 1));
				if (numberOfHours > 12) {
					return null;
				}
				if (
					totalTime.substring(0, 2) === '00' &&
					(totalTime.substring(1, totalTimeWithoutLetters.length) === '0' ||
						totalTime.substring(1, totalTimeWithoutLetters.length) === '00')
				) {
					hours = '00';
				} else {
					if (isPM(totalTime) && numberOfHours !== 12) {
						hours = (numberOfHours + 12).toString();
					} else {
						hours = (
							isAM(totalTime) && numberOfHours === 12 ? 0 : numberOfHours
						).toString();
					}
					minutes = totalTimeWithoutLetters.substring(1, totalTimeWithoutLetters.length);
				}
				break;
			}
			case 4: {
				let numberOfHours = Number(totalTimeWithoutLetters.substring(0, 2));
				if (numberOfHours > 12) {
					return null;
				}
				if (
					totalTime.substring(0, 2) === '00' &&
					(totalTime.substring(2, totalTimeWithoutLetters.length) === '0' ||
						totalTime.substring(2, totalTimeWithoutLetters.length) === '00')
				) {
					hours = '00';
				} else {
					if (isPM(totalTime) && numberOfHours !== 12) {
						hours = (numberOfHours + 12).toString();
					} else {
						hours = (
							isAM(totalTime) && numberOfHours === 12 ? 0 : numberOfHours
						).toString();
					}
					minutes = totalTimeWithoutLetters.substring(2, totalTimeWithoutLetters.length);
				}
				break;
			}
		}
		let timeForParsing = `${hours.length < 2 ? `0${hours}` : hours}:${
			minutes.length < 2 ? `0${minutes}` : minutes
		}`;
		return parseTimeWithSeparatorWithoutString(timeForParsing);
	}
	return parseTimeWithSeparatorWithoutString(totalTime);
}

function parseTimeWithSeparatorWithoutString(totalTime) {
	if (/^\d\d:\d\d$/.test(totalTime)) {
		let startTimeData = totalTime.split(':');
		let hours = startTimeData[0];
		let minutes = startTimeData[1];
		return hours + minutes;
	} else if (/^\d:\d\d$/.test(totalTime)) {
		let startTimeData = totalTime.split(':');
		let hours = `0${startTimeData[0]}`;
		let minutes = startTimeData[1];
		return hours + minutes;
	} else {
		return null;
	}
}

function isAM(totalTime) {
	return totalTime.toLowerCase().endsWith('a') || totalTime.toLowerCase().endsWith('am');
}

function isPM(totalTime) {
	return totalTime.toLowerCase().endsWith('p') || totalTime.toLowerCase().endsWith('pm');
}

function convertTotalTimeTo24HourDisplay(totalTime) {
	let totalTimeWithoutAmOrPm = totalTime.toLowerCase().replace(/((am|a)|(pm|p))/, '');
	let result = totalTimeWithoutAmOrPm;
	if (isPM(totalTime)) {
		if (result.indexOf(':') === -1) {
			result = getTotalTimeWithSeparator(result);
		}
		result = (Number(result.substring(0, result.indexOf(':'))) + 12)
			.toString()
			.concat(result.substring(result.indexOf(':') + 1, result.length));
	}
	return result.replace(':', '');
}

function getTotalTimeWithSeparator(totalTime) {
	switch (totalTime.length) {
		case 1: {
			return `0${totalTime}:00`;
		}
		case 2: {
			return `${totalTime}:00`;
		}
		case 3: {
			return `0${totalTime.substring(0, 1)}:${totalTime.substring(1, 3)}`;
		}
		case 4: {
			return `${totalTime.substring(0, 2)}:${totalTime.substring(2, 4)}`;
		}
		default: {
			return null;
		}
	}
}
