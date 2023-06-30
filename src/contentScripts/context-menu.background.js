aBrowser.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.eventName === 'contextMenuEnabledToggle') {
		toggleBrowserContextMenu(request.enabled);
	} else if (request.eventName === 'updateContexMenu') {
		setContextMenuOnBrowserStart();
	}
});

function listener(info, tab) {
	switch (info.menuItemId) {
		case 'startTimerWithDescriptionCM':
		case 'startTimerCM':
			TimeEntry.startTimerWithDescription(info);
			break;
		default:
			break;
	}
}

function toggleBrowserContextMenu(isContextMenuEnabled) {
	aBrowser.contextMenus.removeAll();
	if (isContextMenuEnabled) {
		aBrowser.contextMenus.create({
			id: 'startTimerWithDescriptionCM',
			title: clockifyLocales.START_TIMER_WITH_DESCRIPTION + ' \'%s\'',
			contexts: ['selection'],
		});
		aBrowser.contextMenus.create({
			id: 'startTimerCM',
			title: clockifyLocales.START_TIMER,
			contexts: ['page'],
		});
		aBrowser.contextMenus.onClicked.removeListener(listener);
		aBrowser.contextMenus.onClicked.addListener(listener);
	}
}

async function setContextMenuOnBrowserStart() {
	const iscmEnabled = await localStorage.getItem(
		'permanent_contextMenuEnabled'
	);
	let isContextMenuEnabled = JSON.parse(iscmEnabled);
	if (typeof isContextMenuEnabled !== 'boolean') {
		isContextMenuEnabled = true;
	}
	toggleBrowserContextMenu(isContextMenuEnabled);
}

this.setContextMenuOnBrowserStart();
