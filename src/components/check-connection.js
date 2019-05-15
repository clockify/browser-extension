export function checkConnection() {
    if(!navigator.onLine) {
        localStorage.setItem('offline', 'true')
    } else {
        localStorage.setItem('offline', 'false')
    }

    return !navigator.onLine;
}