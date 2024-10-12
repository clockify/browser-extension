import { getBrowser } from '../helpers/browser-helper';
import locales from '../helpers/locales';

const getWSCustomFields = () =>
	new Promise((resolve) => {
		getBrowser().runtime.sendMessage(
			{
				eventName: 'getWSCustomField',
				options: {},
			},
			(response) => {
				if (response) {
					const { data, status } = response;
					if (status !== 200) {
						if (status === 403) {
							resolve({
								data: null,
								msg: locales.WORKSPACE_NOT_AUTHORIZED_FOR_CUSTOM_FIELDS,
							});
						} else {
							resolve({ data: null, msg: 'getWSCustomField ' + status });
						}
					} else {
						//_clockifyPopupDlg.wsCustomFields = data;
						//_clockifyPopupDlg.injectLinkModal();
						resolve({ data, msg: '' });
					}
				} else {
					resolve({
						data: null,
						msg: 'Problem with getting the Custom Fields',
					});
				}
			}
		);
	});

var offlineStorage = {
	storageName: 'OfflineStorage',
	isPermanent: true,

	_activeBillableHours: false,
	_onlyAdminsCanChangeBillableStatus: false, // was onlyAdminsSeeBillableRates

	_userHasCustomFieldsFeature: false,
	_wsCustomFields: [],
	_timeEntriesOffline: [],
	_timeEntryInOffline: null,

	async load() {
		const activeBillableHours = await localStorage.getItem(
			'activeBillableHours'
		);
		this._activeBillableHours = activeBillableHours
			? JSON.parse(activeBillableHours)
			: false;
		const onlyAdminsCanChangeBillableStatus = await localStorage.getItem(
			'onlyAdminsCanChangeBillableStatus'
		);
		this._onlyAdminsCanChangeBillableStatus = onlyAdminsCanChangeBillableStatus
			? JSON.parse(onlyAdminsCanChangeBillableStatus)
			: false;
		const workspaceSettings = await localStorage.getItem('workspaceSettings');
		this._userHasCustomFieldsFeature = workspaceSettings
			? JSON.parse(workspaceSettings).features.customFields
			: false;
		const wsCustomFields = await localStorage.getItem('wsCustomFields');
		this._wsCustomFields = wsCustomFields ? JSON.parse(wsCustomFields) : [];
		const timeEntriesOffline = await localStorage.getItem('timeEntriesOffline');
		this._timeEntriesOffline = timeEntriesOffline
			? JSON.parse(timeEntriesOffline)
			: [];
		const timeEntryInOffline = await localStorage.getItem('timeEntryInOffline');
		this._timeEntryInOffline = timeEntryInOffline
			? JSON.parse(timeEntryInOffline)
			: null;

		// this.log('After load storage:');
	},

	// store() {
	//     localStorage.setItem(
	//         this.storageName,
	//         JSON.stringify(this.storage),
	//         this.isPermanent ? 'permanent_' : null
	//     );
	// },

	get activeBillableHours() {
		return this._activeBillableHours;
	},
	set activeBillableHours(val) {
		if (this._activeBillableHours !== val) {
			this._activeBillableHours = val;
			localStorage.setItem('activeBillableHours', JSON.stringify(val));
		}
	},

	get onlyAdminsCanChangeBillableStatus() {
		return this._onlyAdminsCanChangeBillableStatus;
	},
	set onlyAdminsCanChangeBillableStatus(val) {
		if (this._onlyAdminsCanChangeBillableStatus !== val) {
			this._onlyAdminsCanChangeBillableStatus = val;
			localStorage.setItem(
				'onlyAdminsCanChangeBillableStatus',
				JSON.stringify(val)
			);
		}
	},

	async getHideBillable() {
		const isUserOwnerOrAdmin = await this.getIsUserOwnerOrAdmin();
		return (
			!this._activeBillableHours ||
			(this._onlyAdminsCanChangeBillableStatus && !isUserOwnerOrAdmin)
		);
	},

	get userHasCustomFieldsFeature() {
		return this._userHasCustomFieldsFeature;
	},
	set userHasCustomFieldsFeature(val) {
		if (this._userHasCustomFieldsFeature !== val) {
			this._userHasCustomFieldsFeature = val;
			localStorage.setItem('userHasCustomFieldsFeature', JSON.stringify(val));
		}
	},

	get wsCustomFields() {
		return this._wsCustomFields;
	},
	set wsCustomFields(val) {
		this._wsCustomFields = val;
		localStorage.setItem('wsCustomFields', JSON.stringify(val));
	},

	get timeEntriesOffline() {
		return this._timeEntriesOffline;
	},
	set timeEntriesOffline(val) {
		this._timeEntriesOffline = val;
		localStorage.setItem('timeEntriesOffline', JSON.stringify(val));
	},

	get timeEntryInOffline() {
		return this._timeEntryInOffline;
	},
	set timeEntryInOffline(val) {
		if (val === null) {
			this._timeEntryInOffline = val;
			localStorage.setItem('timeEntryInOffline', null);
		} else {
			this._timeEntryInOffline = val;
			localStorage.setItem('timeEntryInOffline', JSON.stringify(val));
			//this._timeEntryInOffline = JSON.parse(localStorage.getItem('timeEntryInOffline'));
		}
	},

	log(x = '') {
		console.log(
			`===>>> OfflineStorage userHasCustomFieldsFeature ${x}:`,
			this._userHasCustomFieldsFeature
		);
		console.log(
			`===>>> OfflineStorage wsCustomFields ${x}:`,
			this._wsCustomFields
		);
		console.log(
			`===>>> OfflineStorage timeEntriesOffline ${x}:`,
			this._timeEntriesOffline
		);
		console.log(
			`===>>> OfflineStorage timeEntryInOffline ${x}:`,
			this._timeEntryInOffline
		);
	},

	getWSCustomField(customFieldId) {
		return this._wsCustomFields.find((cf) => cf.id === customFieldId);
	},

	get timeEntryIdTemp() {
		return (
			Math.random().toString(36).substring(2, 15) +
			Math.random().toString(36).substring(2, 15)
		);
	},

	get customFieldValues() {
		return this._userHasCustomFieldsFeature
			? this._wsCustomFields.map(
					({
						allowedValues,
						workspaceDefaultValue,
						id,
						description,
						name,
						placeholder,
						projectDefaultValues,
						type,
						status,
						onlyAdminCanEdit,
						required,
					}) => ({
						customFieldId: id,
						timeEntryId: this.timeEntryIdTemp,
						value: workspaceDefaultValue,
						onlyAdminCanEdit,
						name,
						description,
						type,
						sourceType: 'WORKSPACE',
						customFieldDto: {
							// we need this upon project change
							id,
							allowedValues,
							workspaceDefaultValue,
							onlyAdminCanEdit,
							placeholder,
							projectDefaultValues,
							required,
							status,
							type,
							name,
						},
					})
			  )
			: [];
	},

	async getIsUserOwnerOrAdmin() {
		const isUserOwnerOrAdmin = await localStorage.getItem('isUserOwnerOrAdmin');
		const isValueAlreadyParsed = typeof isUserOwnerOrAdmin === 'object';
		const parsedValue = isValueAlreadyParsed
			? isUserOwnerOrAdmin
			: JSON.parse(isUserOwnerOrAdmin);
		return isUserOwnerOrAdmin ? parsedValue : false;
	},

	updateCustomFieldValues(timeEntry, customFields) {
		if (timeEntry.customFieldValues) {
			customFields.forEach(({ value, customFieldId }) => {
				const cfIndex = timeEntry.customFieldValues.findIndex(
					(item) => item.customFieldId === customFieldId
				);
				if (cfIndex !== undefined && cfIndex !== null)
					timeEntry.customFieldValues[cfIndex].value = value;
			});
		} else {
			//customFieldValues
		}
	},
};

export { offlineStorage, getWSCustomFields };
