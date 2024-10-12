import moment from 'moment';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import {
	parseTimeEntryDuration,
	TIME_DURATION_MAX_SECONDS,
	getUnmutatedSecondsFromInput,
	getSecondsFromInput,
	numberFormatParse,
	isTimeIntervalValid,
	isTimeIntervalMaxSeconds,
	parseTime,
} from './time-input-parser';
import locales from '../helpers/locales';
import { duration } from 'moment/moment';
import { WorkspaceSettingsDto } from '../DTOs/WorkspaceSettingsDto';
import { numberFormatTransform, NUMBER_FORMATS } from '~/helpers/duration-formater';
import { TimeIntervalDto } from '../DTOs/TimeIntervalDto';
import { TimeInterval } from '~/helpers/TimeInterval';

interface PropsInterface {
	id: string;
	defaultOpenValue: moment.Moment;
	durationFormat: string;
	editDisabled: boolean;
	onChange: Function;
	isDisabled: boolean;
	title: string;
	className: string;
	workspaceSettings: WorkspaceSettingsDto;
	timeInterval: TimeIntervalDto;
	time: TimeIntervalDto;
}

export const MyDurationPicker = ({
	id,
	isDisabled,
	editDisabled,
	className,
	title,
	durationFormat,
	defaultOpenValue,
	onChange,
	workspaceSettings,
	timeInterval,
	time,
}: PropsInterface) => {
	const [timeEntryDurationInput, setTimeEntryDurationInput] = useState('');
	const [timeEntryDurationBackup, setTimeEntryDurationBackup] = useState('');

	const { numberFormat } = workspaceSettings;

	const timeDurationInput = useRef<HTMLInputElement>();

	const classes = `${className}${editDisabled ? ' disable-manual' : ''}`;

	// Init data
	useEffect(() => {
		if (!timeInterval || !durationFormat) return;

		const transformed = numberFormatTransform(
			parseTime(time, durationFormat),
			numberFormat,
			durationFormat
		);

		setTimeEntryDurationInput(transformed);
		setTimeEntryDurationBackup(transformed);
	}, [time]);

	function addFromTimeDurationInput() {
		if (timeEntryDurationInput === timeEntryDurationBackup) {
			return;
		}
		const inputtedSeconds = getUnmutatedSecondsFromInput(
			numberFormatParse(timeEntryDurationInput, NUMBER_FORMATS.COMMA_PERIOD)
		);
		const backupSeconds = getUnmutatedSecondsFromInput(
			numberFormatParse(timeEntryDurationBackup, NUMBER_FORMATS.COMMA_PERIOD)
		);
		const durationWithSeconds = parseTimeEntryDuration(timeEntryDurationInput, durationFormat);

		const durationInMiliseconds = duration(durationWithSeconds).asMilliseconds();
		if (
			(!isTimeIntervalValid(timeEntryDurationInput) &&
				isTimeIntervalMaxSeconds(timeEntryDurationBackup)) ||
			inputtedSeconds > TIME_DURATION_MAX_SECONDS
		) {
			if (backupSeconds > TIME_DURATION_MAX_SECONDS) {
				timeDurationInput.current.value = timeEntryDurationBackup;
				// this.toaster.pop('error', this.translate.instant('TRACKER.TIME_TRACKER.ENTRY.MAX_HOURS_ENTERED'));
				return;
			} else {
				// @ts-ignore
				timeDurationInput.current.value = TIME_DURATION_MAX_SECONDS;
			}
		}

		if (!durationWithSeconds || !durationInMiliseconds) {
			setTimeEntryDurationInput(timeEntryDurationBackup);
			return;
		}
		const seconds = getSecondsFromInput(timeEntryDurationInput, durationFormat);
		setTimeEntryDurationInput(durationWithSeconds);

		const newTimeInterval = getTimeIntervalFromSeconds(seconds);

		dateTimeManualChanged(newTimeInterval);
	}

	function onKeyup(event) {
		if (event.key === 'Enter') {
			event.target.blur();
		} else if (event.key === 'ArrowUp') {
			arrowPressed(true);
		} else if (event.key === 'ArrowDown') {
			arrowPressed(false);
		}
	}

	function arrowPressed(isUp) {
		const durationWithSeconds = parseTimeEntryDuration(timeEntryDurationInput, durationFormat);
		if (!durationWithSeconds) {
			setTimeEntryDurationInput(timeEntryDurationBackup);
			return;
		}
		let seconds = getSecondsFromInput(timeEntryDurationInput, durationFormat);
		if (isUp) {
			seconds += 60;
		} else {
			seconds -= 60;
		}
		if (seconds < 0) {
			seconds = 0;
		}
		const newTimeInterval = getTimeIntervalFromSeconds(seconds);
		setTimeEntryDurationInput(parseTime(newTimeInterval.duration, durationFormat));
	}

	function getTimeIntervalFromSeconds(durationInSeconds) {
		const start = moment(timeInterval.start).clone();
		const end = moment(timeInterval.start).clone().add(durationInSeconds, 's');
		const duration = moment.duration(end.diff(start)).toISOString();

		return new TimeInterval({
			start: start.toISOString(),
			end: end.toISOString(),
			duration: duration,
		});
	}

	function focusTimeEntryDurationInput() {
		if (timeDurationInput.current.disabled) {
			timeDurationInput.current.blur();
			return;
		}

		timeDurationInput.current.select();
		timeDurationInput.current.focus();
	}

	function dateTimeManualChanged(inputTimeInterval) {
		if (inputTimeInterval.duration === timeInterval.duration) {
			return;
		}
		const oldInterval = timeInterval;
		const newInterval = new TimeInterval(inputTimeInterval);

		if (!isTimeIntervalValid(time.duration)) {
			onChange(null, oldInterval);
			return;
		}

		const newIntervalDurationTransformed = parseTime(newInterval.duration);

		onChange(null, newIntervalDurationTransformed);
	}

	return (
		<input
			id={id}
			ref={timeDurationInput}
			className={classes}
			autoComplete="off"
			type="text"
			placeholder={locales.SELECT}
			tabIndex={0}
			spellCheck="false"
			disabled={isDisabled}
			readOnly={editDisabled}
			value={timeEntryDurationInput}
			onChange={event => {
				setTimeEntryDurationInput(event.target.value);
			}}
			onBlur={addFromTimeDurationInput}
			onKeyUp={onKeyup}
			onFocus={focusTimeEntryDurationInput}
			title={title ? title : `${locales.DURATION_FORMAT}: '${durationFormat}'.`}
		/>
	);
};
