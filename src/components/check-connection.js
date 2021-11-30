export function isOffline() {

    // if (localStorage.getItem('offlineForTest')) {
    //     return JSON.parse(localStorage.getItem('offlineForTest'))
    // }

    if (localStorage.getItem('offline') === 'true')
        return true;
    else
        return false;
}

export function checkConnection() {
    if (navigator && !navigator.onLine) {
        localStorage.setItem('offline', 'true')
    } else {
        localStorage.setItem('offline', 'false')
    }
}

