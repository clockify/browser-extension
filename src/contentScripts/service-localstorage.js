function isChrome() {
	if (typeof chrome !== 'undefined' && typeof browser === 'undefined') {
		return true;
	}
	return false;
}

const localStorageEnums = {
	PERMANENT_PREFIX: 'permanent_',
	SELF_HOSTED_PREFIX: 'selfhosted_',
	SUB_DOMAIN_PREFIX: 'sub-domain_',
	ALL: true,
};

//mimics localStorage inisde service worker context
class LocalStorage {
	constructor() {
		this.aBrowser = isChrome() ? chrome : browser;
	}
	async get(key) {
		const promise = new Promise((resolve, reject) => {
			try {
				this.aBrowser.storage.local.get(key, (response) => {
					if (key === null) {
						resolve(response || null);
					} else if (typeof key === 'object' && key.length) {
						const value = Object.values(response)[0];
						resolve(value || null);
					} else {
						resolve(response?.[key] ?? null);
					}
				});
			} catch (error) {}
		});
		return promise;
	}

	async getItem(key, optionalReturnValue) {
		const keys = Object.values(localStorageEnums)
			.filter((el) => typeof el === 'string')
			.map((el) => {
				return el + key;
			});
		keys.push(key);
		const item = await this.get(keys);
		return item || optionalReturnValue || null;
	}

	async set(key, value) {
		const promise = new Promise((resolve, reject) => {
			try {
				this.aBrowser.storage.local.set({ [key]: value }, (res) =>
					resolve(res)
				);
			} catch (error) {}
		});
		return promise;
	}

	async setItem(key, value, optionalPrefix) {
		if (optionalPrefix) {
			key = optionalPrefix + key;
		}
		this.set(key, value);
	}

	async remove(key) {
		const promise = new Promise((resolve, reject) => {
			try {
				this.aBrowser.storage.local.remove(key, (res) => resolve(res));
			} catch (error) {}
		});
		return promise;
	}

	removeItem(itemKey) {
		const keysToDelete = Object.values(localStorageEnums)
			.filter((el) => typeof el === 'string')
			.map((el) => {
				return el + itemKey;
			});
		keysToDelete.push(itemKey);

		if (keysToDelete) {
			this.remove(keysToDelete);
		}
	}

	async clear() {
		const promise = new Promise((resolve, reject) => {
			try {
				this.aBrowser.storage.local.clear((res) => resolve(res));
			} catch (error) {}
		});
		return promise;
	}

	async clearByPrefixes(prefixesToDelete, inverse = false) {
		const allKeys = Object.keys(await this.get(null));

		const keysToDelete = allKeys.filter((key) => {
			const res =
				prefixesToDelete.filter((prefixToDelete) =>
					key.includes(prefixToDelete)
				).length > 0;
			return inverse ? !res : res;
		});

		return await this.remove(keysToDelete);
	}
}

const localStorage = new LocalStorage();
