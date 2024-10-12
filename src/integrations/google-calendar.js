// Both event card & task card
clockifyButton.render('span[jsslot].kma42e', { observe: true }, eventCard => {
	handleDynamicStyles();

	if ($('.clockify-widget-container')) return;

	const eventTimeInterval = text('#xDetDlgWhen .AzuXid.O2VjS.CyPPBf');

	if (!eventTimeInterval) return console.error("Interval can't be extracted.");

	const eventTimeIntervalEndpoints = extractStartAndEnd(eventTimeInterval);

	const description = text('[role="heading"]', eventCard);
	const start = eventTimeIntervalEndpoints.start;
	const end = eventTimeIntervalEndpoints.end;

	const link = clockifyButton.createButton({ description });
	const input = clockifyButton.createInput({ description });
	const event = clockifyButton.createEvent({ description, start, end });

	const container = createTag('div', 'clockify-widget-container');

	container.append(link);
	container.append(input);
	container.append(event);

	eventCard.append(container);
});

// Google Calendar blocks wheel (scrolling) event
// in Clockify integration modal, fix for it:
allowScrollingInModalPopup();
allowMovingScrollbarInModalPopup();

async function allowScrollingInModalPopup() {
	const modal = await waitForElement('.clockify-integration-popup');

	document.addEventListener('wheel', async event => {
		event.stopImmediatePropagation();

		const { target, deltaY } = event;

		const descriptionTextareaWrapper = $('.description-textarea');
		const descriptionTextarea = $('textarea', descriptionTextareaWrapper);
		const projectList = $('.tag-list');
		const tagList = $('.edit-form__project_list');
		const editForm = $('.edit-form');

		if (target.isSameNode(descriptionTextareaWrapper)) descriptionTextarea.scrollBy(0, deltaY);
		if (descriptionTextareaWrapper?.contains(target)) descriptionTextarea.scrollBy(0, deltaY);
		if (target.isSameNode(projectList)) modal.scrollBy(0, deltaY);
		if (projectList?.contains(target)) modal.scrollBy(0, deltaY);
		if (target.isSameNode(tagList)) modal.scrollBy(0, deltaY);
		if (tagList?.contains(target)) modal.scrollBy(0, deltaY);
		if (target.isSameNode(editForm)) modal.scrollBy(0, deltaY);
	});
}

async function allowMovingScrollbarInModalPopup() {
	document.addEventListener('mousedown', event => {
		if (event.target.classList.contains('clockify-integration-popup'))
			event.stopImmediatePropagation();
	});
}

async function handleDynamicStyles() {
	const isManualModeDisabled = await isManuallyDisabled();
	const paddingLeft = await containerPaddingLeft();
	const width = cardWidth();

	const dynamicStyles = `
		.Tnsqdc { 
			height: ${isManualModeDisabled ? '40px' : '80px'}; 
		}

		#xDetDlg {
			width: ${width};
		}

		.clockify-widget-container {
			top: ${isManualModeDisabled ? '17px' : '10px'}; 
			padding-left: ${paddingLeft};
		}
	`;

	applyStyles(dynamicStyles, 'clockify-custom-dynamic-styles');
}

window.addEventListener('workspaceSettingsChanged', handleDynamicStyles);

applyStyles(`
	#xDetDlg {
		max-width: 600px;
	}

	.clockify-widget-container {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		grid-template-rows: repeat(2, 1fr);
		grid-column-gap: 0px;
		grid-row-gap: 0px;
		justify-items: flex-start;
		position: absolute;
	}
	#clockify-manual-input-form {
		margin-left: -25px;
	}
	#clockify-manual-input-form input {
		margin-left: -25px;
		width: 125px;
		margin-left: 7px;
		box-shadow: none;
		border: 1px solid #eaecf0;
		background-color: #eaecf0;
	}
	.clockify-copy-as-entry-container {
		grid-column: span 2;
	}
	#clockifyButton {
		display: flex;
		align-items: center;
	}
`);

function cardWidth() {
	const defaultCardWidth = 448;

	const defaultIconsCount = 3;
	const iconsCount = $$('.pPTZAe > div').length;
	const iconsExcess = iconsCount - defaultIconsCount || 0;

	const pixelsToAddForAnyExtraIcon = 40;

	return pixels(defaultCardWidth + iconsExcess * pixelsToAddForAnyExtraIcon);
}

function pixels(number) {
	return `${number}px`;
}

async function containerPaddingLeft() {
	const randomCardElement = await waitForElement('span[jsslot].kma42e .zZj8Pb.EaVNbc');

	if (!randomCardElement) return '0px';

	const paddingLeftInsideCard = parseInt(
		window
			.getComputedStyle(randomCardElement, null)
			.getPropertyValue('padding-left')
			.slice(0, -2)
	);
	const pixelsToAdd = 3;
	const containerPaddingLeft = paddingLeftInsideCard + pixelsToAdd;

	return pixels(containerPaddingLeft);
}

/* 
	The following functions are parsers/rearrangers/converters that 
	Google Calendar's event time interval should pass through in 
	order to get, step by step, interval endpoints as a valid JavaScript
	dates that will reprensent Clockify time entry start and end points.

	Google Calendar's event time interval can have any of the following formats: 

	(1) Sunday, December 10
	(2) Sunday, January 21, 2024
	(3) Wednesday, April 26⋅2:00 – 3:00pm
	(4) Monday, September 11⋅9:45 – 10:15am
	(5) Wednesday, April 26⋅11:30am – 12:45pm
	(6) Wednesday, April 26⋅11:30am – 12:00am
	(7) April 25, 2023, 11:15pm – April 26, 2023, 6:45am
	(8) Monday, January 1, 2024⋅5:00 – 6:00pm
*/

function extractStartAndEnd(interval) {
	const intermediate1 = removeSpecialCharacters(interval);
	const intermediate2 = removeDayOfWeek(intermediate1);
	const intermediate3 = replaceMonthNameToIndex(intermediate2);
	const intermediate4 = convertTo24HourFormat(intermediate3);
	const parsedInterval = makeStartAndEnd(intermediate4);

	return parsedInterval;
}

function removeSpecialCharacters(interval) {
	return interval
		.replaceAll(',', '')
		.replaceAll('⋅', ' ')
		.replaceAll(' – ', ' - ')
		.replaceAll(':', ' ')
		.replaceAll(/(\d)([ap]m)/g, '$1 $2');
}

function removeDayOfWeek(interval) {
	const days = `Monday Tuesday Wednesday Thursday Friday Saturday Sunday`;
	const dayList = days.split(' ');

	const dayCleaner = word => !dayList.includes(word);

	return interval.split(' ').filter(dayCleaner).join(' ');
}

function replaceMonthNameToIndex(interval) {
	const months = `January February March April May June July August September October November December`;
	const monthList = months.split(' ');

	const monthReplacer = word => (monthList.includes(word) ? monthList.indexOf(word) : word);

	return interval.split(' ').map(monthReplacer).join(' ');
}

function convertTo24HourFormat(interval) {
	const hasIntervalMeridien = interval.includes('-');

	if (!hasIntervalMeridien) return interval;

	const start = interval.split(' - ')[0].split(' ');
	const end = interval.split(' - ')[1].split(' ');

	const hasStartAM = start.includes('am');
	const hasStartPM = start.includes('pm');
	const hasEndAM = end.includes('am');
	const hasEndPM = end.includes('pm');

	const hasStartMeridien = hasStartAM || hasStartPM;

	const isEndAM = hasEndAM && !hasEndPM;
	/* Note: start time without both 'am' and 'pm' should have the same meridien as end time */
	if (!hasStartMeridien) start.push(isEndAM ? 'am' : 'pm');
	const isStartAM = hasStartAM && !hasStartPM;

	const indexOfStartHours = start.indexOf(isStartAM ? 'am' : 'pm') - 2;
	const indexOfEndHours = end.indexOf(isEndAM ? 'am' : 'pm') - 2;
	const indexOfEndMinutes = end.indexOf(isEndAM ? 'am' : 'pm') - 1;
	const indexOfEndDay = end.indexOf(isEndAM ? 'am' : 'pm') - 4;

	const startHours = parseInt(start[indexOfStartHours]);
	const endHours = parseInt(end[indexOfEndHours]);
	const endMinutes = parseInt(end[indexOfEndMinutes]);
	const endDay = parseInt(end[indexOfEndDay]);

	if (isStartAM && startHours === 12) start[indexOfStartHours] = 0;
	else if (!isStartAM && startHours !== 12) start[indexOfStartHours] = startHours + 12;

	if (isEndAM) {
		if (endHours === 12 && endMinutes === 0) {
			end[indexOfEndHours] = 23;
			end[indexOfEndMinutes] = 59;
			end[indexOfEndDay] = endDay - 1;
		}

		if (endHours === 12 && endMinutes !== 0) end[indexOfEndHours] = 0;
	} else if (!isEndAM && endHours !== 12) end[indexOfEndHours] = endHours + 12;

	const formatted = `${start.join(' ')} - ${end.join(' ')}`;

	return formatted.replaceAll('am', '').replaceAll('pm', '').replaceAll('  ', ' ');
}

function makeStartAndEnd(interval) {
	const howManyTimesWhitespaceOccurs = interval.split(' ').length - 1;
	const currentYear = new Date().getFullYear();

	const toInteger = x => parseInt(x);

	const start = interval.split(' - ')[0]?.split(' ')?.map(toInteger);
	const end = interval.split(' - ')[1]?.split(' ')?.map(toInteger);

	let startYear, startMonth, startDay, startHours, startMinutes;
	let endYear, endMonth, endDay, endHours, endMinutes;

	switch (howManyTimesWhitespaceOccurs) {
		case 1:
			[month, day] = interval.split(' ').map(toInteger);
			(startYear = currentYear), (endYear = currentYear);
			(startMonth = month), (endMonth = month);
			(startDay = day), (endDay = day);
			(startHours = 0), (endHours = 23);
			(startMinutes = 0), (endMinutes = 59);
			break;
		case 2:
			[month, day, year] = interval.split(' ').map(toInteger);
			(startYear = year), (endYear = year);
			(startMonth = month), (endMonth = month);
			(startDay = day), (endDay = day);
			(startHours = 0), (endHours = 23);
			(startMinutes = 0), (endMinutes = 59);
			break;
		case 7:
			[startMonth, startDay, startHours, startMinutes] = start;
			[endHours, endMinutes] = end;
			(startYear = currentYear), (endYear = currentYear);
			endMonth = startMonth;
			endDay = startDay;
			break;
		case 8:
			[startMonth, startDay, startYear, startHours, startMinutes] = start;
			[endHours, endMinutes] = end;
			endYear = startYear;
			endMonth = startMonth;
			endDay = startDay;
			break;
		case 11:
			[startMonth, startDay, startYear, startHours, startMinutes] = start;
			[endMonth, endDay, endYear, endHours, endMinutes] = end;
			break;
		default:
			throw new Error('Unsuccessfully parsing based on whitespace number.');
	}

	const intervalWithEndpoints = {
		start: new Date(startYear, startMonth, startDay, startHours, startMinutes),
		end: new Date(endYear, endMonth, endDay, endHours, endMinutes),
	};

	return intervalWithEndpoints;
}
