export function isOffline() {
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

