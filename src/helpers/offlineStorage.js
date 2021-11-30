import {LocalStorageService} from "../services/localStorage-service";
import {getBrowser} from "../helpers/browser-helper";

const localStorageService = new LocalStorageService();

const getWSCustomFields = () =>
    new Promise(resolve => {
        getBrowser().runtime.sendMessage({
            eventName: 'getWSCustomField',
            options: {}
        }, (response) => {
            console.log('getWSCustomFields response', response)
            if (response) {
                const { data, status } = response;
                if (status !== 200) {
                    if (status === 403) {
                        resolve({data: null, msg: 'Your Workspace is not authorized for Custom Fields'})
                    }
                    else {
                        resolve({data: null, msg: "getWSCustomField " + status})
                    }
                } 
                else {
                    console.log('getWSCustomField', data)
                    //_clockifyPopupDlg.wsCustomFields = data;
                    //_clockifyPopupDlg.injectLinkModal();
                    resolve({ data, msg: ""})
                }
            }
            else {
                resolve({data: null, msg: 'Problem with getting the Custom Fields'})
            }
        }); 
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

    load() {
        this._activeBillableHours = localStorage.getItem('activeBillableHours') ?
            JSON.parse(localStorage.getItem('activeBillableHours'))
            : false;

        this._onlyAdminsCanChangeBillableStatus = localStorage.getItem('onlyAdminsCanChangeBillableStatus') ?
            JSON.parse(localStorage.getItem('onlyAdminsCanChangeBillableStatus'))
            : false;

        this._userHasCustomFieldsFeature = localStorage.getItem('userHasCustomFieldsFeature') ?
            JSON.parse(localStorage.getItem('userHasCustomFieldsFeature'))
            : false;

        this._wsCustomFields = localStorage.getItem('wsCustomFields')
            ? JSON.parse(localStorage.getItem('wsCustomFields')):
            [];

        this._timeEntriesOffline =
            localStorage.getItem('timeEntriesOffline') 
                ? JSON.parse(localStorage.getItem('timeEntriesOffline')) 
                : [];

        this._timeEntryInOffline = localStorage.getItem('timeEntryInOffline')
            ? JSON.parse(localStorage.getItem('timeEntryInOffline'))
            : null;

        // this.log('After load storage:');
    },

    // store() {
    //     localStorageService.set(
    //         this.storageName,
    //         JSON.stringify(this.storage),
    //         this.isPermanent ? 'permanent_' : null
    //     );
    // },
    
    
    get activeBillableHours() { return this._activeBillableHours },
    set activeBillableHours(val) {
        if (this._activeBillableHours !== val) {
            this._activeBillableHours = val;
            localStorage.setItem('activeBillableHours', JSON.stringify(val)) 
        }
    },

    get onlyAdminsCanChangeBillableStatus() { return this._onlyAdminsCanChangeBillableStatus },
    set onlyAdminsCanChangeBillableStatus(val) {
        if (this._onlyAdminsCanChangeBillableStatus !== val) {
            this._onlyAdminsCanChangeBillableStatus = val;
            localStorage.setItem('onlyAdminsCanChangeBillableStatus', JSON.stringify(val)) 
        }
    },

    get hideBillable() {
        //console.log('------')
        //console.log('this._activeBillableHours', this._activeBillableHours)
        //console.log('this._onlyAdminsCanChangeBillableStatus', this._onlyAdminsCanChangeBillableStatus)
        //console.log('this.isUserOwnerOrAdmin', this.isUserOwnerOrAdmin)
        return !this._activeBillableHours || this._onlyAdminsCanChangeBillableStatus && !this.isUserOwnerOrAdmin;
    },

    get userHasCustomFieldsFeature() { return this._userHasCustomFieldsFeature },
    set userHasCustomFieldsFeature(val) {
        if (this._userHasCustomFieldsFeature !== val) {
            this._userHasCustomFieldsFeature = val;
            localStorage.setItem('userHasCustomFieldsFeature', JSON.stringify(val)) 
        }
    },

    get wsCustomFields() { return this._wsCustomFields },
    set wsCustomFields(val) {
        this._wsCustomFields = val;
        localStorage.setItem('wsCustomFields', JSON.stringify(val)) 
    },

    get timeEntriesOffline() { return this._timeEntriesOffline },
    set timeEntriesOffline(val) {
        this._timeEntriesOffline = val;
        localStorage.setItem('timeEntriesOffline', JSON.stringify(val)) 
    },

    get timeEntryInOffline() { return this._timeEntryInOffline },
    set timeEntryInOffline(val) {
        if (val === null) {
            this._timeEntryInOffline = val;
            localStorage.setItem('timeEntryInOffline', null);
        }
        else {
            this._timeEntryInOffline = val;
            localStorage.setItem('timeEntryInOffline', JSON.stringify(val));
            //this._timeEntryInOffline = JSON.parse(localStorage.getItem('timeEntryInOffline'));
        }
    },

    log(x='') {
        console.log(`===>>> OfflineStorage userHasCustomFieldsFeature ${x}:`, this._userHasCustomFieldsFeature)
        console.log(`===>>> OfflineStorage wsCustomFields ${x}:`, this._wsCustomFields)
        console.log(`===>>> OfflineStorage timeEntriesOffline ${x}:`, this._timeEntriesOffline)
        console.log(`===>>> OfflineStorage timeEntryInOffline ${x}:`, this._timeEntryInOffline)
    },

    getWSCustomField(customFieldId) {
        return this._wsCustomFields.find(cf => cf.id === customFieldId);
    },

    get timeEntryIdTemp() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    },

    get customFieldValues() {
        return this._userHasCustomFieldsFeature
            ? this._wsCustomFields.map(({
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
                required
            }) => ({
                customFieldId: id,
                timeEntryId: this.timeEntryIdTemp,
                value: workspaceDefaultValue,
                onlyAdminCanEdit,
                name,
                description,
                type,
                sourceType: 'WORKSPACE',
                customFieldDto: { // we need this upon project change
                    id,
                    allowedValues,
                    workspaceDefaultValue,
                    onlyAdminCanEdit,
                    placeholder,
                    projectDefaultValues,
                    required,
                    status,
                    type,
                    name
                }
            }))
            : [];
    },

    get isUserOwnerOrAdmin() {
        return localStorage.getItem('isUserOwnerOrAdmin')
            ? JSON.parse(localStorage.getItem('isUserOwnerOrAdmin'))
            : false;
    },

    updateCustomFieldValues(timeEntry, customFields) {
        if (timeEntry.customFieldValues) {
            customFields.forEach(({ value, customFieldId }) => {
                const cf = timeEntry.customFieldValues.find(item => item.customFieldId === customFieldId);
                if (cf) 
                    cf.value = value
            });
        }
        else {
            alert('it should have customFieldValues')
        }
    }
}

export  { offlineStorage, getWSCustomFields };
