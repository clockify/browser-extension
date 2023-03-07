let iconStatus = { timeEntryStarted: 1, timeEntryEnded: 2 };
Object.freeze(iconStatus);

export function getIconStatus() {
	return iconStatus;
}
