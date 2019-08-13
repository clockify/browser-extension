const aBrowser = chrome || browser;
render('.cl-tracker-wrapper:not(.clockify)', {observe: true}, function (elem) {
    let workspaceId = JSON.parse(localStorage.getItem('defaultWorkspace')).id;
    let userId = JSON.parse(localStorage.getItem('user')).id;
    let userEmail = JSON.parse(localStorage.getItem('user')).email;
    let weekStart = JSON.parse(localStorage.getItem('user')).settings.weekStart;
    let timeZone = JSON.parse(localStorage.getItem('user')).settings.timeZone;
    let userSettings = JSON.parse(localStorage.getItem('user')).settings;
    aBrowser.storage.sync.set({
        token: `${localStorage.getItem('token')}`,
        activeWorkspaceId: workspaceId,
        userId: userId,
        weekStart: weekStart,
        timeZone: timeZone,
        refreshToken: `${localStorage.getItem('refreshToken')}`,
        userEmail: userEmail,
        userSettings: JSON.stringify(userSettings)
    });
});
function render(selector, opts, renderer, mutationSelector) {
    if (opts.observe) {
        var observer = new MutationObserver(function (mutations) {
            var matches = mutations.filter(function (mutation) {
                return mutation.target.matches(mutationSelector);
            });
            if (!!mutationSelector && !matches.length) {
                return;
            }

            renderTo(selector, renderer);
        });
        observer.observe(document, {childList: true, subtree: true});
    }
    renderTo(selector, renderer);
}

function renderTo(selector, renderer) {
    var i, len, elems = document.querySelectorAll(selector);
    for (i = 0, len = elems.length; i < len; i += 1) {
        elems[i].classList.add('clockify');
    }
    for (i = 0, len = elems.length; i < len; i += 1) {
        renderer(elems[i]);
    }
}
aBrowser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if(request.method === 'getLocalStorage') {
        sendResponse({
            token: `${localStorage.getItem('token')}`,
            activeWorkspace: `${localStorage.getItem('defaultWorkspace')}`,
            user: `${localStorage.getItem('user')}`,
            userId: `${JSON.parse(localStorage.getItem('user')).id}`,
            refreshToken: `${localStorage.getItem('refreshToken')}`,
            userEmail: `${JSON.parse(localStorage.getItem('user')).email}`
        });
    }
});
