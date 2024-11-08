class IntegrationSelectors {
	static externalResource = 'https://clockify.me/downloads/selectors.json';
	static internalResource = '../integrations/selectors.json';

	static fetchAndStore = async ({ onlyIfPassedFollowingMinutesSinceLastFetch } = {}) => {
		try {
			const minimumMinutesBetweenFetches = onlyIfPassedFollowingMinutesSinceLastFetch ?? 0;

			const availableToFetch = await this.isExpired({
				minimumMinutesBetweenFetches,
			});

			if (!availableToFetch) {
				const minutesUntilExpiration = await this.getExpirationMinutes(
					minimumMinutesBetweenFetches
				);
				const secondsUntilExpiration = minutesUntilExpiration * 60;

				const message = `Fetching remote selectors is blocked, it will be available in ${Number(
					minutesUntilExpiration
				).toFixed(2)} minutes (${Math.round(secondsUntilExpiration)} seconds).`;

				console.warn(message);

				return;
			}

			//console.log('Trying to fetch selectors remotely...');
			const externalSelectors = await this.fetch(this.externalResource, {
				cache: 'no-store',
				'cache-control': 'no-cache',
			});
			await this.store(externalSelectors);
			//console.log('%cFetching selectors remotely succeed.', 'color: green;');
		} catch (error) {
			console.error('Fetching selectors remotely failed:', error);
			try {
				//console.log('Trying to fetch selectors locally...');
				const internalSelectors = await this.fetch(this.internalResource);
				await this.store(internalSelectors);
				//console.log('%cFetching selectors locally succeed.', 'color: green;');
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
			throw error;
		}
	};

	static getLastFetchTime = async () => {
		try {
			const lastFetchTime = await localStorage.getItem('integrationSelectorsLastFetchTime');
			const lastFetchTimeHasValue = !!lastFetchTime;

			return lastFetchTimeHasValue ? parseInt(lastFetchTime) : 0;
		} catch (error) {
			console.error('Error getting last fetch time:', error);
			throw error;
		}
	};

	static getExpirationMinutes = async minimumMinutesBetweenFetches => {
		const currentTime = Date.now();
		const lastFetchTime = await this.getLastFetchTime();
		const passedTimeSinceLastFetch = currentTime - lastFetchTime;
		const passedMinutesSinceLastFetch = passedTimeSinceLastFetch / 60000;

		const expirationMinutes = minimumMinutesBetweenFetches - passedMinutesSinceLastFetch;

		return expirationMinutes;
	};

	static fetch = async (resource, options = {}) => {
		try {
			const response = await ClockifyService.apiCall(resource, 'GET', null, true, options);

			const selectors = response.data;
			const hasResponseError = !Boolean(selectors) || Boolean(response.error);
			const errorMessage = response?.error?.message || 'Response is null';

			if (hasResponseError) throw new Error(errorMessage);

			return selectors;
		} catch (error) {
			throw error;
		}
	};

	static store = async selectors => {
		try {
			const currentTime = Date.now().toString();
			await localStorage.setItem('integrationSelectors', selectors);
			await localStorage.setItem('integrationSelectorsLastFetchTime', currentTime);
		} catch (error) {
			console.error('Error storing selectors:', error);
			throw error;
		}
	};
}
