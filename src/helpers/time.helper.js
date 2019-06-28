import moment from "moment";

const oneDayInSeconds = 86400;

export function add24hIfEndBeforeStart(startTime, endTime) {
    const difference = moment(endTime).diff(startTime, 's');

    if (difference < 0) {
        endTime = moment(endTime).add(1, 'days');
    }

    if (difference > oneDayInSeconds) {
        endTime = moment(endTime).subtract(1, 'days');
    }

    return endTime;
}