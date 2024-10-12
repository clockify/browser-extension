async function isNavigatorOffline() {
	const offline = await localStorage.getItem('offline');
	if (offline) return JSON.parse(offline);
	else return true;
}

function isChrome() {
	if (typeof chrome !== 'undefined') {
		if (typeof browser !== 'undefined') {
			return false;
		} else {
			return true;
		}
	}
	return false;
}

async function createHttpHeaders(token) {
	let headers = {
		Accept: 'application/json',
		'Content-Type': 'application/json'
	};

	if (token) {
		headers['X-Auth-Token'] = token;
	}
	const wsConnectionId = await localStorage.getItem('wsConnectionId');
	if (wsConnectionId) {
		headers['socket-connection-id'] = wsConnectionId;
	}

	headers['App-Name'] = 'extension-' + (isChrome() ? 'chrome' : 'firefox');
	headers['App-Version'] = aBrowser.runtime.getManifest().version;

	const subDomainName = await localStorage.getItem('sub-domain_subDomainName');
	if (subDomainName) {
		headers['sub-domain-name'] = subDomainName;
	}

	const lang = await localStorage.getItem('lang');
	if (lang) {
		headers['accept-language'] = lang;
	}

	return headers;
}

function errorObj(status, message, errorData) {
	return {
		data: null,
		error: {
			status,
			message,
			errorData
		}
	};
}

class ClockifyService {
	constructor() {
	}

	static get userId() {
		return localStorage.getItem('userId');
	}

	static get userEmail() {
		return localStorage.getItem('userEmail');
	}

	static get workspaceId() {
		return localStorage.getItem('activeWorkspaceId');
	}

	static get apiEndpoint() {
		return localStorage.getItem('permanent_baseUrl');
	}

	static get user() {
		return localStorage.getItem('user');
	}

	// Here we have a list of endpoints that we want to cache
	// and the time they should be cached for
	static routesToCache = [
		{ path: '/auth/token/refresh', expiresInMilliseconds: 3 * 1000 },
		{
			path: '/timeEntries/recent?limit=',
			expiresInMilliseconds: 1000,
		},
	];
	// Here we store the cached data
	static cache = {};

	static addToCache(endpoint, data) {
		this.cache[endpoint] = {
			...data,
			timestamp: new Date().getTime()
		};
	}

	static removeFromCache(endpoint) {
		delete this.cache[endpoint];
	}

	// Here we store the requests that are currently being made
	// so that we don't make the same request twice
	// Only one request will be made and the other requests will wait for the first one to finish
	static requestQueue = {};

	// This function will check if the endpoint is in the list of endpoints to cache
	static isEndpointInRoutesToCache(endpoint) {
		return this.routesToCache.find(route => endpoint.includes(route.path));
	}

	static async getForces() {
		const ws = await localStorage.getItem('workspaceSettings');
		const us = await localStorage.getItem('userSettings');
		const wsSettings = ws
			? JSON.parse(ws)
			: {
				forceDescription: false,
				forceProjects: false,
				forceTasks: false,
				projectPickerSpecialFilter: false,
				forceTags: false
			};
		const userSettings = us
			? JSON.parse(us)
			: {
				projectPickerSpecialFilter: false
			  };
		const {
			forceDescription,
			forceProjects,
			forceTasks,
			forceTags
		} = wsSettings;
		const {
			projectPickerSpecialFilter
		} = userSettings;
		return {
			forceDescription,
			forceProjects,
			forceTasks,
			projectPickerSpecialFilter,
			forceTags
		};
	}

	static async getCreateObjects() {
		const str = await localStorage.getItem('permanent_createObjects');
		if (!str) return false;
		return JSON.parse(str);
	}

	static async getCanCreateProjects() {
		let workspaceSettings = await localStorage.getItem('workspaceSettings');
		workspaceSettings = JSON.parse(workspaceSettings);
		let userRoles = await localStorage.getItem('userRoles');
		userRoles = userRoles.map((userRole) => userRole.role);
		const { whoCanCreateProjectsAndClients } =
		workspaceSettings?.entityCreationPermissions || {
			whoCanCreateProjectsAndClients: 'ADMINS'
		};
		const isEnabledCreateProject =
			whoCanCreateProjectsAndClients === 'EVERYONE' ||
			userRoles.includes('WORKSPACE_ADMIN') ||
			(whoCanCreateProjectsAndClients === 'ADMINS_AND_PROJECT_MANAGERS' &&
				userRoles.includes('PROJECT_MANAGER'));

		return isEnabledCreateProject;
	}

	static async getCanCreateTasks() {
		let workspaceSettings = await localStorage.getItem('workspaceSettings');
		workspaceSettings = JSON.parse(workspaceSettings);
		let userRoles = await localStorage.getItem('userRoles');
		userRoles = userRoles.map((userRole) => userRole.role);
		const { whoCanCreateTasks } =
		workspaceSettings?.entityCreationPermissions || {
			whoCanCreateTasks: 'ADMINS'
		};
		const isEnabledCreateTask =
			whoCanCreateTasks === 'EVERYONE' ||
			userRoles.includes('WORKSPACE_ADMIN') ||
			(whoCanCreateTasks === 'ADMINS_AND_PROJECT_MANAGERS' &&
				userRoles.includes('PROJECT_MANAGER'));
		return isEnabledCreateTask;
	}

	static async getCanCreateTags() {
		let workspaceSettings = await localStorage.getItem('workspaceSettings');
		workspaceSettings = JSON.parse(workspaceSettings);
		let userRoles = await localStorage.getItem('userRoles');
		userRoles = userRoles.map(userRole => userRole.role);
		const { whoCanCreateTags } = workspaceSettings?.entityCreationPermissions || {
			whoCanCreateTags: 'ADMINS',
		};
		const isEnabledCreateTags =
			whoCanCreateTags === 'EVERYONE' ||
			userRoles.includes('WORKSPACE_ADMIN') ||
			(whoCanCreateTags === 'ADMINS_AND_PROJECT_MANAGERS' &&
				userRoles.includes('PROJECT_MANAGER'));
		return isEnabledCreateTags;
	}

	static async setOnline() {
		const storageOffline = await localStorage.getItem('offline');
		if (!storageOffline || storageOffline === 'true') {
			localStorage.setItem('offline', 'false');
		}
	}

	static async setOffline() {
		const storageOffline = await localStorage.getItem('offline');
		if (!storageOffline || storageOffline === 'false') {
			localStorage.setItem('offline', 'true');
		}
	}

	static async handleBannedResponse(errorData) {
		const aBrowser = isChrome() ? chrome : browser;
		// error returned on banned workspace will be
		// 'You’ve been logged out since your 63b7f35f0cf4083520b4cfb7 workspace has been suspended. Contact support@clockify.me for more information';
		// so if the error is of this format we know it's a workspace ban
		// otherwise it's probably a user ban
		const bannedWorkspaceRegex =
			/You’ve been logged out since your ([a-f\d]{24}) workspace has been suspended\. Contact support@clockify\.me for more information/;
		const regexMatch = errorData.message?.match(bannedWorkspaceRegex);

		if (regexMatch) {
			const workspaceId = regexMatch[1]; // Extract the workspace ID from the first capture group
			aBrowser.runtime.sendMessage({
				eventName: 'WORKSPACE_BANNED',
				options: { ...errorData, workspaceId }
			});
		} else if (
			errorData.message?.includes('Access to workspace is denied') ||
			errorData.message?.includes('account has been disabled')
		) {
			aBrowser.runtime.sendMessage({
				eventName: 'USER_BANNED',
				options: errorData
			});
		}
	}

	static async apiCall(
		endpoint,
		method = 'GET',
		body = null,
		withNoToken = false,
		additionalHeaders
	) {
		let token;
		if (withNoToken) {
			token = null;
		} else {
			token = await TokenService.getToken();
			if (!token) {
				return errorObj('0', 'token is missing');
			}
		}

		const hdrs = await createHttpHeaders(token);
		const mergedHeaders = additionalHeaders ? { ...hdrs, ...additionalHeaders } : hdrs;
		const headers = new Headers(mergedHeaders);

		//TODO: this is a temporary fix for the sub-domain-name header
		const baseUrl = await this.apiEndpoint;
		const signupUrl = `${baseUrl}/auth/`;
		if (endpoint === signupUrl) {
			headers.delete('sub-domain-name');
		}

		const routeToCache = this.isEndpointInRoutesToCache(endpoint);
		// Check if the data is in the cache and not expired
		// if it is, return it and don't make the request
		if (routeToCache) {
			const cachedData = this.cache[endpoint];
			// Check if the data is in the cache and not expired
			if (
				cachedData &&
				cachedData.timestamp + routeToCache.expiresInMilliseconds > Date.now()
			) {
				return Promise.resolve(cachedData);
			}

			// Check if the request was already fired but did not yet get saved to the cache
			if (this.requestQueue[endpoint]) {
				const requestData = await this.requestQueue[endpoint];
				// once the request is done, delete it from the queue
				delete this.requestQueue[endpoint];
				return Promise.resolve(requestData);
			}
		}

		const request = new Request(endpoint, {
			method,
			headers,
			body: body ? JSON.stringify(body) : null
		});

		const fetchRequest = fetch(request)
			.then(async response => {
				if (response.type === 'error') {
					this.setOffline();
					// return Network errors
				} else {
					this.setOnline();
				}
				let errorData;
				const errorMessagesThatShouldBeReturnedToComponent = [
					/Client with name '.*' already exists/,
					/.* project for client  already exists./,
					/Task name has to be between 1 and 1000 characters long/,
					/.* project for client .* already exists./,
					/Tag with name .* already exists/,
					/Manual time tracking disabled on .*/,
					/Task with name '.*' already exists/
				];
				switch (response.status) {
					case 400:
					case 501:
						const { message } = await response.json();

						const returnMessageToComponent =
							errorMessagesThatShouldBeReturnedToComponent.find(pattern =>
								pattern.test(message)
							);

						if (returnMessageToComponent) return errorObj(400, message);

						return errorObj(
							400,
							`${clockifyLocales.YOU_ALREADY_HAVE_ENTRY_WITHOUT}. ${clockifyLocales.PLEASE_EDIT_YOUR_TIME_ENTRY}.`
						);
					case 403:
						errorData = await response.json();
						if (errorData) {
							if (errorData.code === 406) {
								this.handleBannedResponse(errorData);
								return errorObj(response.status, errorData?.message, errorData);
							} else if (errorData.code === 4017) {
								aBrowser.runtime.sendMessage({
									eventName: 'TOKEN_INVALID',
									options: errorData
								});
								return errorObj(response.status, 'Token invalid', errorData);
							} else if (errorData.code === 4030) {
								return errorObj(
									response.status,
									'Manual time tracking disabled',
									errorData
								);
							} else if (errorData.code === 501) {
								return errorObj(response.status, 'Access Denied', errorData);
							} else if (errorData.code === 1003) {
								return errorObj(response.status, 'Can\'t edit locked time entry.', errorData);
							}
						}
						return errorObj(response.status, 'Unauthenticated');
					case 404:
						return errorObj(response.status, 'Not found');
					case 405:
						return errorObj(response.status, 'Method not allowed');
					case 406:
						errorData = await response.json();
						this.handleBannedResponse(errorData);
						return errorObj(response.status, 'Banned', errorData);
					case 401:
						errorData = await response.json();
						if (errorData) {
							if (errorData.code === 4019) {
								aBrowser.runtime
									.sendMessage({
										eventName: 'VERIFY_EMAIL_ENFORCED',
										message: {},
									})
									.then(response => {
										console.log(response);
									})
									.catch(error => console.log(error));
							}
							if (errorData.code === 406) {
								this.handleBannedResponse(errorData);
								return errorObj(response.status, errorData?.message, errorData);
							} else if (errorData.code === 4017 || errorData.code === 4023) {
								aBrowser.runtime.sendMessage({
									eventName: 'TOKEN_INVALID',
									options: errorData
								});
								return errorObj(response.status, 'Token invalid', errorData);
							}
							if (errorData.code === 1000) {
								aBrowser.runtime.sendMessage({
									eventName: 'TOKEN_INVALID',
									options: errorData
								});
								return errorObj(response.status, errorData);
							}
						}
						return errorObj(response.status, 'Forbidden');
					default:
					// fall through
				}
				let data;
				if (response.ok) {
					try {
						data = await response.json();
					} catch {
						data = null;
					}
					// If the endpoint is in the routesToCache, cache the result
					if (routeToCache) {
						this.addToCache(endpoint, {
							data,
							error: null,
							status: response.status
						});

						// Schedule cache busting after the expiresInMilliseconds duration
						setTimeout(() => {
							this.removeFromCache(endpoint);
						}, routeToCache.expiresInMilliseconds);
					}
					return { data, error: null, status: response.status };
				} else {
					const errorMessage = await response.text();
					return errorObj(response.status, errorMessage);
				}
			})
			.catch(error => {
				// this.setOffline();
				console.error('There has been a problem with your fetch operation: ', error); // error.message

				return errorObj(0, error);
			});

		// If the endpoint is in the routesToCache, add the request	to the requestQueue
		// so that if the same request is made again, we can return the same promise
		if (routeToCache) {
			this.requestQueue[endpoint] = fetchRequest;
		}

		// TODO Take care request failed, probably because of wrong permissions
		return await fetchRequest;
	}
}
