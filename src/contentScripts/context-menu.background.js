aBrowser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.eventName === 'contextMenuEnabledToggle') {
        toggleBrowserContextMenu(request.enabled)
    }
});


function toggleBrowserContextMenu(isContextMenuEnabled) {
    aBrowser.contextMenus.removeAll();
    if (isContextMenuEnabled) {
        aBrowser.contextMenus.create({
            "title": "Start timer with description '%s'",
            "contexts": ["selection"],
            "onclick": (info) => TimeEntry.startTimerWithDescription(info)
        });
        aBrowser.contextMenus.create({
            "title": "Start timer",
            "contexts": ["page"],
            "onclick": (info) => TimeEntry.startTimerWithDescription(info)
        });
    }

}


function setContextMenuOnBrowserStart() {
    let isContextMenuEnabled =  JSON.parse(localStorage.getItem("permanent_contextMenuEnabled"));
    if (typeof isContextMenuEnabled !== "boolean") {
        isContextMenuEnabled = true
    }
    toggleBrowserContextMenu(isContextMenuEnabled)
}

this.setContextMenuOnBrowserStart();
