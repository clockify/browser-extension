import moment from 'moment';
function isNumeric(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}
export function timeIntervalDuration(timeInterval) {
	const end = timeInterval.end ? new Date(timeInterval.end) : new Date();
	return end.getTime() - new Date(timeInterval.start).getTime();
}
export class TimeInterval {
	constructor(obj) {
		this._start = obj && obj.start;
		this._end = obj && obj.end;
		const hasDurationData = obj && (obj.duration || obj.duration === 0);
		this._duration = hasDurationData ? this.getDuration(obj.duration) : null;
	}
	getDuration(d) {
		if (isNumeric(d)) {
			return moment.duration(d, 's').toISOString();
		} else {
			return moment.duration(d).toISOString();
		}
	}
	get start() {
		return this._start;
	}
	set start(value) {
		this._start = value;
	}
	get end() {
		return this._end;
	}
	set end(value) {
		this._end = value;
	}
	get duration() {
		return this._duration;
	}
	set duration(value) {
		this._duration = value;
	}
	toObject() {
		return {
			start: this.start,
			end: this.end,
		};
	}
	updateDate(startDate, endDate) {
		if (startDate && endDate) {
			this._start = `${startDate}T${this.start.slice(11, 19)}`;
			this._end = `${endDate}T${this.end.slice(11, 19)}`;
		}
	}
}
