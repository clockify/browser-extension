import React, { useEffect, useRef, useState } from 'react';
import moment from 'moment';

interface PropsInterface {
	currentTime: moment.Moment;
	interval: number;
	isBreak: boolean;
}

export const CountdownTimer = (props: PropsInterface): JSX.Element => {
	const timeOut =
		moment().diff(props.currentTime, 'ms') > props.interval * 60 * 1000;
	const pixelsPerSecond = 750 / (props.interval * 60);

	const referentTime = useRef(
		moment(props.currentTime).add(props.interval, 'minutes')
	);

	const [time, setTime] = useState(
		moment(referentTime.current).subtract(moment())
	);
	const [dashOffset, setDashOffset] = useState(
		pixelsPerSecond * moment().diff(props.currentTime, 's')
	);

	useEffect(() => {
		let intervalId: NodeJS.Timeout;

		if (!timeOut) {
			intervalId = setInterval(() => {
				const newTime = moment(referentTime.current).subtract(moment());

				setTime(newTime);
				setDashOffset((prev) => prev + pixelsPerSecond);

				if (newTime.minutes() === 0 && newTime.seconds() === 0) {
					clearInterval(intervalId);
				}
			}, 1000);
		}

		return () => clearInterval(intervalId);
	}, []);

	return (
		<div className="countdown-timer">
			<span className="rem-time">
				{timeOut ? '00:00' : time.format('mm:ss')}
			</span>
			<svg>
				<circle r="120" cx="50%" cy="50%" className="bg-circle"></circle>
				<circle
					r="120"
					cx="50%"
					cy="50%"
					className={'rem-circle' + (props.isBreak ? ' rem-circle-break' : '')}
					strokeDashoffset={dashOffset + 'px'}
					opacity={
						(time.minutes() === 0 && time.seconds() === 0) || timeOut ? 0 : 1
					}
				></circle>
			</svg>
		</div>
	);
};
