class IntegrationSelectors {
	static externalResource = 'https://clockify.me/downloads/selectors.json';
	static internalResource = '../integrations/selectors.json';

	static fetchAndStore = async ({
		onlyIfPassedFollowingMinutesSinceLastFetch,
	} = {}) => {
		try {
			const minimumMinutesBetweenFetches =
				onlyIfPassedFollowingMinutesSinceLastFetch ?? 0;

			const availableToFetch = await this.isExpired({
				minimumMinutesBetweenFetches,
			});

			if (!availableToFetch) return;

			const externalSelectors = await this.fetch(this.externalResource, {
				cache: 'no-store',
			});
			await this.store(externalSelectors);
		} catch (error) {
			console.error('Fetching selectors remotely failed:', error);
			try {
				const internalSelectors = await this.fetch(this.internalResource);
				await this.store(internalSelectors);
			} catch (error) {
				console.error('Fetching selectors locally failed:', error);
			}
		}
	};

	static isExpired = async ({ minimumMinutesBetweenFetches }) => {
		try {
			const currentTime = Date.now();
			const lastFetchTime = await this.getLastFetchTime();
			const passedTimeSinceLastFetch = currentTime - lastFetchTime;
			const minimumTimeBetweenFetches = minimumMinutesBetweenFetches * 60000;

			return passedTimeSinceLastFetch > minimumTimeBetweenFetches;
		} catch (error) {
			console.error('Error checking expiry:', error);
			throw error;
		}
	};

	static getLastFetchTime = async () => {
		try {
			const lastFetchTime = await localStorage.getItem(
				'integrationSelectorsLastFetchTime'
			);
			const lastFetchTimeHasValue = !!lastFetchTime;

			return lastFetchTimeHasValue ? parseInt(lastFetchTime) : 0;
		} catch (error) {
			console.error('Error getting last fetch time:', error);
			throw error;
		}
	};

	static fetch = async (resource, options = {}) => {
		try {
			const response = await fetch(resource, options);

			if (!response.ok) throw new Error('Unsuccessful response.');

			const selectors = await response.json();
			return selectors;
		} catch (error) {
			throw error;
		}
	};

	static store = async (selectors) => {
		try {
			const currentTime = Date.now().toString();
			await localStorage.setItem('integrationSelectors', selectors);
			await localStorage.setItem(
				'integrationSelectorsLastFetchTime',
				currentTime
			);
		} catch (error) {
			console.error('Error storing selectors:', error);
			throw error;
		}
	};
}
