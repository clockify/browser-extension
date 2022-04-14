function isChrome() {
    if (typeof chrome !== "undefined") {
        if (typeof browser !== "undefined") {
            return false;
        } else {
            return true;
        }
    }
    return false;
}

//mimics localStorage inisde service worker context
class LocalStorage {
    constructor () {
        this.aBrowser = isChrome() ? chrome : browser;
    }
    async getItem (key) {
        const promise = new Promise((resolve, reject) => {
            try {
                this.aBrowser.storage.local.get(key, (response) => {
                    if (key === null) {
                        resolve(response || null);
                    }
                    else if (typeof key === 'object' && key.length){
                        const value = Object.values(response)[0];
                        resolve(value || null);
                    }
                    else {
                        resolve((response && response[key]) || null);
                    }
                });
            } catch (error) { 
                console.log(error);
            }
        });
        return promise;
    }

    async setItem (key, value) {
        const promise = new Promise((resolve, reject) => {
            try{
                this.aBrowser.storage.local.set({[key]: value}, res => resolve(res)); 
            } catch (error) {
                console.log(error);
            }
        });
        return promise;
    }

    async removeItem (key) {
        const promise = new Promise((resolve, reject) => {
            try{
                this.aBrowser.storage.local.remove(key, res => resolve(res)); 
            } catch (error) {
                console.log(error);
            }
        });
        return promise;
    }

    async clear () {
        const promise = new Promise((resolve, reject) => {
            try{
                this.aBrowser.storage.local.clear(res => resolve(res)); 
            } catch (error) {
                console.log(error);
            }
        });
        return promise;
    }
}

const localStorage = new LocalStorage();