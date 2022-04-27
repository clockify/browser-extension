var _supportedLanguages = ['en', 'fr', 'es', 'pt', 'ru', 'de'];

var _isIntegration = typeof self._clockifyMessages !== 'undefined';

self.aBrowser = chrome || browser;

self.aBrowser.storage.local.get('workspaceSettings', ({workspaceSettings}) => {
    if (workspaceSettings) {
        self.wsSettings = JSON.parse(workspaceSettings);
    }
});

self.aBrowser.storage.onChanged.addListener((changes) => {
    if (changes.workspaceSettings && changes.workspaceSettings.newValue) {
        self.wsSettings = JSON.parse(changes.workspaceSettings.newValue);
    }
});

function detectBrowserLanguage() {

    const language = self.aBrowser.i18n.getUILanguage();

    let lang = language;
    if (lang.indexOf('-') !== -1)
        lang = lang.split('-')[0];
    if (lang.indexOf('_') !== -1)
        lang = lang.split('_')[0];
    return _supportedLanguages.includes(lang) ? lang : 'en';
}

var locales = {
    browserLanguage: detectBrowserLanguage(),
    lang: 'en',
    messages: _isIntegration ? self._clockifyMessages : null,

    loadLocaleMessagesFromJson(lang = 'en') {
        fetch(`_locales/${lang}/messages.json`)
            .then((res) => res.json())
            .then(messages => {
                this.lang = lang;
                this.messages = messages;
                self.aBrowser.storage.local.set({'locale_messages': messages});
                self.aBrowser.runtime.sendMessage({
                    eventName: "updateContexMenu"
                });
            }
        )
    },

    onProfileLangChange(lang) {
        if(!lang){
            lang = this.browserLanguage;
        }
        if (!_supportedLanguages.includes(lang)){
            lang = 'en';
        }
        self.aBrowser.storage.local.set({'lang': lang});
        this.loadLocaleMessagesFromJson(lang);
    },   

    getMsg(key) {
        let kljuc = this.messages[key];
        return kljuc ? kljuc.message : 'Unknown:' + key
    },


    getMessage(id, params) {
        // let messageLng = this.lang;
        // if (!this.lang)
        //     messageLng = 'en';
        if (!_isIntegration && (!this.messages || !Object.keys(this.messages).length)) {
            if (self.aBrowser.i18n.getMessage) {
                    return params
                        ? self.aBrowser.i18n.getMessage(id, params)
                        : self.aBrowser.i18n.getMessage(id);
                }
        }

        if(!this.messages){
            this.messages = {};
        }
        
        if (!params) {
            return this.getMsg(id);
        }

        let kljuc = this.messages[id];
        if (!kljuc || !kljuc.message)
            return 'Unknown:' + kljuc;
        if (!kljuc.placeholders)
            return kljuc.message
        let message = kljuc.message;
        try {
            for (const prop in kljuc.placeholders) {
                message = message.replace('$' + prop + '$', 
                    params[parseInt(kljuc.placeholders[prop].content.replace('$', ''))-1])
            }
        }
        catch(error) {
        }
        return message
    },

    replaceLabels(localeStr) {
        if(!self.wsSettings || !self.wsSettings.projectLabel || !self.wsSettings.taskLabel || !self.wsSettings.projectGroupingLabel){
            return localeStr;
        }
        const { projectLabel, taskLabel, projectGroupingLabel } = self.wsSettings;
        const regex = new RegExp(`(${this.PROJECTS_DEFAULT}|${this.PROJECT_DEFAULT}|${this.TASKS_DEFAULT}|${this.TASK_DEFAULT}|${this.CLIENTS_DEFAULT}|${this.CLIENT_DEFAULT})`, 'gi');
        const pluralRegex = new RegExp(`(${this.PROJECTS_DEFAULT}|${this.TASKS_DEFAULT}|${this.CLIENTS_DEFAULT})`, 'i');
        return localeStr.replaceAll(regex, (match) => {
            const plural = pluralRegex.test(match);
            let label = projectLabel;
            if (match.toLowerCase() === this.TASK_DEFAULT.toLowerCase() ||
                match.toLowerCase() === this.TASKS_DEFAULT.toLowerCase()) {
                label = taskLabel;
            }
            else if (match.toLowerCase() === this.CLIENT_DEFAULT.toLowerCase() ||
                     match.toLowerCase() === this.CLIENTS_DEFAULT.toLowerCase()) {
                label = projectGroupingLabel;
            }
            if (/[A-Z][a-z]+/.test(match)) {
                return this.CUSTOM_LABEL(label, plural, 'capital');
            }
            else if (/[a-z]+/.test(match)) {
                return this.CUSTOM_LABEL(label, plural, 'lowercase');
            }
            else {
                return this.CUSTOM_LABEL(label, plural, 'uppercase');
            }
        });
    },
    

    CUSTOM_LABEL(label, plural = false, caseType = 'lowercase') {
        if(!label) return;
        let result = label;
        label = label.toUpperCase().replaceAll(' ', '_');
        const defaultOptions = ['CLIENT', 'PROJECT', 'TASK'];
        const options = ['CLIENT', 'DEPARTMENT', 'CATEGORY', 'PROJECT', 'LOCATION', 'JOB', 'TASK', 'ACTIVITY', 'JOB_AREA'];
       
        if(options.includes(label)){
            if(plural){
                if(label[label.length - 1] === 'Y') {
                    label = label.slice(0, label.length - 1) + 'IE';
                }
                label += 'S';
            }
            if(defaultOptions.includes(plural ? label.slice(0, label.length - 1) : label)){
                label = label + '_DEFAULT';
            }
            result = this[label];
        }

        result = caseType === 'lowercase' || caseType === 'capital' ? result.toLowerCase() : result.toUpperCase();

        if(caseType === 'capital'){
            result = result[0].toUpperCase() + result.slice(1);
        }
        
        return result;
    },

    get WHAT_ARE_YOU_WORKING_ON() { return this.getMessage('TRACKER__TIME_TRACKER__ENTRY__TRACK__PLACEHOLDER__TIMER') },

    get START() { return this.getMessage('TRACKER__START') },
    get STOP() { return this.getMessage('TRACKER__STOP') },

    get START_TIMER() { 
        return this.getMessage('TRACKER__TIME_TRACKER__START_TIMER_TOOLTIP') 
    },
    get STOP_TIMER() { return this.getMessage('EXTENSION__STOP_TIMER') },
    get TIMER() { return this.getMessage('TRACKER__TIME_TRACKER__ENTRY__TRACK__TIMER') }, // 'Timer'

    get DESCRIPTION_LABEL() { return this.getMessage('GLOBAL__DESCRIPTION_LABEL') },
    get NO_DESCRIPTION() { return this.getMessage('PAGES__DASHBOARD__TEAM_ACTIVITIES__ACTIVITY__NO_DESCRIPTION') },
    get ENTER_DESCRIPTION() { return this.getMessage('GLOBAL__ENTER_DESCRIPTION_PLACEHOLDER') },

    get REQUIRED() { return this.getMessage('SHARED_MODULES__STRIPE__REQUIRED') },
    get REQUIRED_LABEL() { return this.getMessage('SHARED_MODULES__STRIPE__REQUIRED_LABEL') },  // (required)

    get BILLABLE_LABEL() { return this.getMessage('GLOBAL__BILLABLE_LABEL') },
    get TODAY_LABEL() { return this.getMessage('GLOBAL__TODAY_LABEL') },
    get OK_BTN() { return this.getMessage('GLOBAL__CONFIRM_OK_BTN') },

    get MANUAL() { return this.getMessage('GLOBAL__MANUAL_LABEL') },
    get DISABLED_MANUAL_MODE() { return this.getMessage('CALENDAR__INTEGRATIONS__DISABLED_MANUAL_MODE_TOOLTIP') },

    get WORKSPACE() { return this.getMessage('GLOBAL__WORKSPACE_LABEL') },
    get SETTINGS() { return this.getMessage('LAYOUT__SIDEBAR__NAVIGATION__SETTINGS_LABEL') },
    get INTEGRATIONS() { return this.getMessage('WORKSPACE__SETTINGS__TABS__INTEGRATIONS_TITLE') },
    get DASHBOARD() { return this.getMessage('GLOBAL__DASHBOARD_LABEL') },
    get ADD_TAGS() { return this.getMessage('GLOBAL__ADD_TAGS_LABEL') },
    get ADD() { return this.getMessage('GLOBAL__ADD_LABEL') },
    get CREATE_NEW_PROJECT() { return this.replaceLabels(this.getMessage('GLOBAL__CREATE_NEW_PROJECT_TITLE')) },
    get CREATE_NEW_TASK() { return this.replaceLabels(this.getMessage('SHARED_MODULES__SHARED__CREATE_NEW_TASK_LABEL')) },
    get SELECT() { return this.getMessage('SHARED_MODULES__CUSTOM_FIELD__TYPE_SELECT_LABEL') },
    get WITHOUT_CLIENT() { return this.replaceLabels(this.getMessage('PROJECTS__SHARED__WITHOUT_CLIENT_PLACEHOLDER')) },
    get WITHOUT_TASK() { return this.replaceLabels(this.getMessage('GLOBAL__WITHOUT_TASK_LABEL')) },
    get CANT_SAVE_WITHOUT_REQUIRED_FIELDS() { return this.getMessage('TIMESHEET2__MESSAGES__SAVE_ERROR_MISSING_FIELDS') },
    get TASK() { return this.replaceLabels(this.getMessage('GLOBAL__TASK_LABEL')) },
    get TASK_DEFAULT() { return this.getMessage('GLOBAL__TASK_LABEL') },
    get TASKS() { return this.replaceLabels(this.getMessage('GLOBAL__TASKS_LABEL')) },
    get TASKS_DEFAULT() { return this.getMessage('GLOBAL__TASKS_LABEL') },
    get PROJECT() { return this.replaceLabels(this.getMessage('GLOBAL__PROJECT_LABEL')) },
    get PROJECT_DEFAULT() { return this.getMessage('GLOBAL__PROJECT_LABEL') },
    get PROJECTS() { return this.replaceLabels(this.getMessage('GLOBAL__PROJECTS_LABEL')) },
    get PROJECTS_DEFAULT() { return this.getMessage('GLOBAL__PROJECTS_LABEL') },
    get CLIENT() { return this.replaceLabels(this.getMessage('GLOBAL__CLIENT_LABEL')) },
    get CLIENT_DEFAULT() { return this.getMessage('GLOBAL__CLIENT_LABEL') },
    get CLIENTS() { return this.replaceLabels(this.getMessage('GLOBAL__CLIENTS_LABEL')) },
    get CLIENTS_DEFAULT() { return this.getMessage('GLOBAL__CLIENTS_LABEL') },
    get TAGS() { return this.getMessage('GLOBAL__TAGS_LABEL') },
    get TAG() { return this.getMessage('GLOBAL__TAG_LABEL') },
    get NO_PROJECT() { return this.replaceLabels(this.getMessage('GLOBAL__NO_PROJECT_LABEL')) },
    get MINUTES() { return this.getMessage('GLOBAL__MINUTES_LABEL') },
    get FAVORITES() { return this.getMessage('GLOBAL__FAVORITES_LABEL') },
    

    NO_MATCHING(entityInPlural) {
        return this.getMessage('PROJECTS__FILTER_DROPDOWN__NO_MATCHING_ENTITIES_LABEL', [entityInPlural])
    },
    FILTER_NAME(name) {
        return this.getMessage('REPORTS__MODELS__CUSTOM_FIELD_FILTER_LABEL', [name])
    },
    TASKS_NUMBER(number) { return this.replaceLabels(this.getMessage('SHARED_MODULES__PROJECT_PICKER__COUNT_TASKS_LABEL', [number])) },
    get FIND_PROJECTS() {
        return this.replaceLabels(this.getMessage('GLOBAL__PROJECT_FIND'))
    },
    get FIND_TAGS() {
        return this.getMessage('GLOBAL__FIND_TAGS_LABEL')
    },
    get LOG_OUT() { return this.getMessage('LAYOUT__DEFAULT_LAYOUT__LOG_OUT_BTN') },
    get MONKEY_SEARCH() { return this.replaceLabels(this.getMessage('SHARED_MODULES__PROJECT_PICKER__FILTER_BY_PROJECT_INFO')) },
    get TAG__GET__ERROR() { return this.getMessage('SERVICES__TAG__GET__ERROR_MESSAGE') },
    get CUSTOM_FIELDS() { return this.getMessage('GLOBAL__CUSTOM_FIELDS_LABEL') },

    get ARE_YOU_SURE_DELETE() { return this.getMessage('REPORTS__DETAILED_REPORT__DELETE_MODAL_BODY') },
    get DELETE() { return this.getMessage('GLOBAL__DELETE_BTN') },
    get CANCEL() { return this.getMessage('GLOBAL__CANCEL_BTN') },
    get HOURS() { return this.getMessage('GLOBAL__HOURS_LABEL') },
    get DURATION_FORMAT() { return this.getMessage('WORKSPACE__GENERAL_SETTINGS__DURATION_FORMAT__TITLE') },
    get TOTAL() { return this.getMessage('GLOBAL__TOTAL_TIME') },

    get MONDAY() { return this.getMessage('TEAMS__REMINDERS__WEEKDAYS__MONDAY') },
    get MONDAY_SHORT() { return this.getMessage('TEAMS__REMINDERS__WEEKDAYS__MODAY_SHORT') },
    get TUESDAY() { return this.getMessage('TEAMS__REMINDERS__WEEKDAYS__TUESDAY') },
    get TUESDAY_SHORT() { return this.getMessage('TEAMS__REMINDERS__WEEKDAYS__TUESDAY_SHORT') },
    get WEDNESDAY() { return this.getMessage('TEAMS__REMINDERS__WEEKDAYS__WEDNESDAY') },
    get WEDNESDAY_SHORT() { return this.getMessage('TEAMS__REMINDERS__WEEKDAYS__WEDNESDAY_SHORT') },
    get THURSDAY() { return this.getMessage('TEAMS__REMINDERS__WEEKDAYS__THURSDAY') },
    get THURSDAY_SHORT() { return this.getMessage('TEAMS__REMINDERS__WEEKDAYS__THURSDAY_SHORT') },
    get FRIDAY() { return this.getMessage('TEAMS__REMINDERS__WEEKDAYS__FRIDAY') },
    get FRIDAY_SHORT() { return this.getMessage('TEAMS__REMINDERS__WEEKDAYS__FRIDAY_SHORT') },
    get SATURDAY() { return this.getMessage('TEAMS__REMINDERS__WEEKDAYS__SATURDAY') },
    get SATURDAY_SHORT() { return this.getMessage('TEAMS__REMINDERS__WEEKDAYS__SATURDAY_SHORT') },
    get SUNDAY() { return this.getMessage('TEAMS__REMINDERS__WEEKDAYS__SUNDAY') },
    get SUNDAY_SHORT() { return this.getMessage('TEAMS__REMINDERS__WEEKDAYS__SUNDAY_SHORT') },

    ///////////////
    // EXTENSION__
    get ADD_PROJECT() { return this.replaceLabels(this.getMessage('EXTENSION__ADD_PROJECT')) },
    get ADD_TASK() { return this.getMessage('EXTENSION__ADD_TASK') },
    get SHORTCUT() { return this.getMessage('EXTENSION__SHORTCUT') },
    get START_TIMER_WHEN_BROWSER_STARTS() { return this.getMessage('EXTENSION__START_TIMER_WHEN_BROWSER_STARTS') },
    get STOP_TIMER_WHEN_BROWSER_CLOSES() { return this.getMessage('EXTENSION__STOP_TIMER_WHEN_BROWSER_CLOSES') },
    get STOP_TIMER() { return this.getMessage('EXTENSION__STOP_TIMER') },
    get DESCRIPTION_REQUIRED() { return this.getMessage('EXTENSION__DESCRIPTION_REQUIRED') },
    get START_STOP_TIME_SHORTCUT() { return this.getMessage('EXTENSION__START_STOP_TIME_SHORTCUT') },
    get DEFAULT_PROJECT_ARCHIVED() { return this.replaceLabels(this.getMessage('EXTENSION__DEFAULT_PROJECT_ARCHIVED')) },
    get DEFAULT_TASK_DONE() { return this.replaceLabels(this.getMessage('EXTENSION__DEFAULT_TASK_DONE')) },
    get DEFAULT_TASK_DOES_NOT_EXIST() { return this.replaceLabels(this.getMessage('EXTENSION__DEFAULT_TASK_DOES_NOT_EXIST')) },
    get DEFAULT_PROJECT_NOT_AVAILABLE() { return this.replaceLabels(this.getMessage('EXTENSION__DEFAULT_PROJECT_NOT_AVAILABLE')) },
    get YOU_CAN_SET_A_NEW_ONE_IN_SETTINGS() { return this.getMessage('EXTENSION__YOU_CAN_SET_A_NEW_ONE_IN_SETTINGS') },
    get COMPLETE_CURRENT_ENTRY() { return this.getMessage('EXTENSION__COMPLETE_CURRENT_ENTRY') },
    get ENTER_REQUIRED_FIELDS() { return this.getMessage('EXTENSION__ENTER_REQUIRED_FIELDS') },
    get CANNOT_START_ENTRY_WITHOUT_PROJECT() { return this.replaceLabels(this.getMessage('EXTENSION__CANNOT_START_ENTRY_WITHOUT_PROJECT')) },
    get EDIT_YOUR_TIME_ENTRY() { return this.getMessage('EXTENSION__EDIT_YOUR_TIME_ENTRY') },
    get CREATE_TIME_ENTRY_USING_DASHBOARD() { return this.getMessage('EXTENSION__CREATE_TIME_ENTRY_USING_DASHBOARD') },
    get ENABLE_INTEGRATIONS() { return this.getMessage('EXTENSION__ENABLE_INTEGRATIONS') },
    get ENABLE_TOOLS() { return this.getMessage('EXTENSION__ENABLE_TOOLS') },
    get ENABLE_ALL_INTEGRATIONS() { return this.getMessage('ENABLE_ALL_INTEGRATIONS') },
    get ENABLE_ALL() { return this.getMessage('EXTENSION__ENABLE_ALL') },
    get ENTRY_MODE() { return this.getMessage('EXTENSION__ENTRY_MODE') },
    get DISABLE_ALL() { return this.getMessage('EXTENSION__DISABLE_ALL') },
    get CUSTOM_DOMAINS() { return this.getMessage('EXTENSION__CUSTOM_DOMAINS') },
    get HOSTED_ON_CUSTOM_DOMAIN() { return this.getMessage('EXTENSION__HOSTED_ON_CUSTOM_DOMAIN') },
    get ENTER_DOMAIN_NAME() { return this.getMessage('EXTENSION__ENTER_DOMAIN_NAME') },
    get PORTS_NOT_SUPPORTED() { return this.getMessage('EXTENSION__PORTS_NOT_SUPPORTED') },
    get NO_RECENT_ENTRIES_TO_SHOW() { return this.getMessage('EXTENSION__NO_RECENT_ENTRIES_TO_SHOW') },
    get YOU_HAVE_NOT_TRACKED() { return this.getMessage('EXTENSION__YOU_HAVE_NOT_TRACKED') },
    get GET_ONLINE() { return this.getMessage('EXTENSION__GET_ONLINE') },
    get YOU_CAN_STILL_TRACK_TIME() { return this.getMessage('EXTENSION__YOU_CAN_STILL_TRACK_TIME') },
    get ENABLE_DARK_MODE() { return this.getMessage('EXTENSION__ENABLE_DARK_MODE') },
    get DEFAULT_PROJECT() { return this.replaceLabels(this.getMessage('EXTENSION__DEFAULT_PROJECT')) },
    get DEFAULT_PROJECT_AND_TASK() { return this.replaceLabels(this.getMessage('EXTENSION__DEFAULT_PROJECT_AND_TASK')) },
    get LAST_USED_PROJECT() { return this.replaceLabels(this.getMessage('EXTENSION__LAST_USED_PROJECT')) },
    get INTEGRATIONS_CAN_CREATE_PROJECTS() { return this.replaceLabels(this.getMessage('EXTENSION__INTEGRATIONS_CAN_CREATE_PROJECTS')) },
    get SHOW_POST_START_POPUP() { return this.getMessage('EXTENSION__SHOW_POST_START_POPUP') },
    get REMIND_ME_TO_TRACK_TIME() { return this.getMessage('EXTENSION__REMIND_ME_TO_TRACK_TIME') },
    get MINUTES_SINCE_LAST_ENTRY() { return this.getMessage('EXTENSION__MINUTES_SINCE_LAST_ENTRY') },
    get ENABLE_CONTEXT_MENU() { return this.getMessage('EXTENSION__ENABLE_CONTEXT_MENU') },
    get IDLE_DETECTION() { return this.getMessage('EXTENSION__IDLE_DETECTION') },
    get DETECT_IDLE_TIME() { return this.getMessage('EXTENSION__DETECT_IDLE_TIME') },
    get CANT_START_ENTRY_WITHOUT_PROJECT() { return this.replaceLabels(this.getMessage('EXTENSION__CANT_START_ENTRY_WITHOUT_PROJECT')) },
    get PLEASE_EDIT_YOUR_TIME_ENTRY() { return this.getMessage('EXTENSION__PLEASE_EDIT_YOUR_TIME_ENTRY') },
    get CANNOT_END_ENTRY() { return this.replaceLabels(this.getMessage('EXTENSION__CANNOT_END_ENTRY')) },
    get YOU_MUST_BE_LOGGED_IN_TO_START() { return this.getMessage('EXTENSION__YOU_MUST_BE_LOGGED_IN_TO_START') },
    get YOU_ALREADY_HAVE_ENTRY_WITHOUT() { return this.getMessage('EXTENSION__YOU_ALREADY_HAVE_ENTRY_WITHOUT') },
    get ENTER_REQUIRED_FIELDS_OR_EDIT_WORKSPACE_SETTINGS() { return this.getMessage('EXTENSION__ENTER_REQUIRED_FIELDS_OR_EDIT_WORKSPACE_SETTINGS') },
    get EXT_RELOADED() { return this.getMessage('EXTENSION__EXT_RELOADED') },
    get EXT_CONTEXT_INVALIDATED() { return this.getMessage('EXTENSION__EXT_CONTEXT_INVALIDATED') },
    get REFRESH_THE_PAGE() { return this.getMessage('EXTENSION__REFRESH_THE_PAGE') },
    get WORKSPACE_NOT_AUTHORIZED_FOR_CUSTOM_FIELDS() { return this.getMessage('EXTENSION__WORKSPACE_NOT_AUTHORIZED_FOR_CUSTOM_FIELDS') },
    get TIME_ADDED() { return this.getMessage('EXTENSION__TIME_ADDED') },
    get CUSTOM_DOMAIN_ENABLE() { return this.getMessage('EXTENSION__CUSTOM_DOMAIN_ENABLE') },
    get CREATE_AN_ACCOUNT() { return this.getMessage('EXTENSION__CREATE_AN_ACCOUNT') },
    get NEW_HERE() { return this.getMessage('EXTENSION__NEW_HERE') },
    get NAME_AND_COLOR_ARE_REQUIRED() { return this.getMessage('EXTENSION__NAME_AND_COLOR_ARE_REQUIRED') },

    get ENABLE_POMODORO_TIMER() { return this.getMessage('EXTENSION__ENABLE_POMODORO_TIMER') },
    get TIMER_INTERVAL() { return this.getMessage('EXTENSION__TIMER_INTERVAL') },
    get SHORT_BREAK() { return this.getMessage('EXTENSION__SHORT_BREAK') },
    get LONG_BREAK() { return this.getMessage('EXTENSION__LONG_BREAK') },
    get LONG_BREAK_STARTS_AFTER() { return this.getMessage('EXTENSION__LONG_BREAK_STARTS_AFTER') },
    get BREAKS() { return this.getMessage('EXTENSION__BREAKS') },
    get SOUND_NOTIFICATION() { return this.getMessage('EXTENSION__SOUND_NOTIFICATION') },
    get AUTOMATIC_BREAKS() { return this.getMessage('EXTENSION__AUTOMATIC_BREAKS') },
    get DEFAULT_BREAK_PROJECT() { return this.replaceLabels(this.getMessage('EXTENSION__DEFAULT_BREAK_PROJECT')) },
    get AND_TASK() { return this.replaceLabels(this.getMessage('EXTENSION__AND_TASK')) },

    get ADD_TIME() { return this.getMessage('EXTENSION__ADD_TIME') },
    get BACK() { return this.getMessage('EXTENSION__BACK') },
    get CHANGE_SAVED() { return this.getMessage('EXTENSION__CHANGE_SAVED') },
    get CREATE_NEW_CLIENT() { return this.replaceLabels(this.getMessage('EXTENSION__CREATE_NEW_CLIENT')) },
    get NAME_IS_REQUIRED() { return this.getMessage('EXTENSION__NAME_IS_REQUIRED') },
    get SELECT_COLOR() { return this.getMessage('EXTENSION__SELECT_COLOR') },
    get ENTER_TIME() { return this.getMessage('EXTENSION__ENTER_TIME') },
    get REFRESH() { return this.getMessage('REFRESH') },
    get LOGIN_TO_CUSTOM_DOMAIN() { return this.getMessage('EXTENSION__LOGIN_TO_CUSTOM_DOMAIN') },
    get LOGIN_TO_SUB_DOMAIN() { return this.getMessage('EXTENSION__LOGIN_TO_SUB_DOMAIN') },
    get RETURN_TO_CLOCKIFY_CLOUD() { return this.getMessage('EXTENSION__RETURN_TO_CLOCKIFY_CLOUD') },

    get SELECT_CLIENT() { return this.replaceLabels(this.getMessage('PROJECTS__SHARED__SELECT_CLIENT_PLACEHOLDER')) },

    get CREATE_TASK() { return this.replaceLabels(this.getMessage('SHARED_MODULES__SHARED__CREATE_TASK_LABEL')) },
    get CREATE_NEW_TAG() { return this.getMessage('EXTENSION__CREATE_NEW_TAG') },
    get TAG_NAME() { return this.getMessage('AUDIT_LOG__TABLE_COLUMNS__TAG__NAME') },
    get PROJECT_NAME() { return this.replaceLabels(this.getMessage('AUDIT_LOG__TABLE_COLUMNS__PROJECT__NAME')) },
    get CLIENT_NAME() { return this.replaceLabels(this.getMessage('AUDIT_LOG__TABLE_COLUMNS__CLIENT__NAME')) },
    get TASK_NAME() { return this.replaceLabels(this.getMessage('AUDIT_LOG__TABLE_COLUMNS__TASK__NAME')) },
    get SUBMIT() { return this.getMessage('GLOBAL__SUBMIT') },
    get NONE() { return this.getMessage('GLOBAL__NONE_LABEL') },
    get LOAD_MORE() { return this.getMessage('ACTIVITY_TABS__LOCATIONS__LOAD_MORE_BTN') },
    get LOG_IN() { return this.getMessage('GLOBAL__LOG_IN_LABEL') },
    get PUBLIC() { return this.getMessage('GLOBAL__PUBLIC_LABEL') },
    get FROM() { return this.getMessage('EXTENSION__FROM') },
    get TO() { return this.getMessage('EXTENSION__TO') },
    get PROJECT_NAME_LENGTH_ERROR() { return this.replaceLabels(this.getMessage('PROJECTS__MESSAGES__PROJECT_NAME_LENGTH_ERROR')) },
    get SUBDOMAIN_NAME() { return this.getMessage('WORKSPACE__SUBDOMAIN__PLACEHOLDER_FOR_NAME') },
    get SIGNUP_TITLE() { return this.getMessage('REGISTER__SIGNUP__TITLE') },
    get CREATE_ACCOUNT_EXPLANATION() { return this.getMessage('REGISTER__SIGNUP__CREATE_ACCOUNT_EXPLANATION') },
    get INVALID_EMAIL() { return this.getMessage('SERVICES__AUTHENTIFICATION__EMAIL__VALIDATION__ERROR_MESSAGE') },
    get AGREE_LABEL() { return this.getMessage('REGISTER__SIGNUP__AGREE_LABEL') },
    get TOS() { return this.getMessage('GLOBAL__TOS') },
    get ALREADY_HAVE_AN_ACCOUNT() { return this.getMessage('EXTENSION__ALREADY_HAVE_AN_ACCOUNT') },
    get TOS_ACCEPT_ERROR() { return this.getMessage('REGISTER__SHARED__TOS_ACCEPT_ERROR') },
    PASSWORD_MIN_LENGTH_ERROR_MSG(minLength) { return this.getMessage('REGISTER__SHARED__PASSWORD_MIN_LENGTH_ERROR_MSG', [minLength]) },  
    get EMAIL() { return this.getMessage('GLOBAL__EMAIL_LABEL') },
    get PASSWORD() { return this.getMessage('GLOBAL__PASSWORD_LABEL') }, 
    get CUSTOM_DOMAIN_URL() { return this.getMessage('EXTENSION__CUSTOM_DOMAIN_URL') }, 
    get CUSTOM_DOMAIN_DESCRIPTION() { return this.getMessage('EXTENSION__CUSTOM_DOMAIN_DESCRIPTION') }, 
    get SIGNUP() { return this.getMessage('GLOBAL__SIGNUP_LABEL') },

    get LAST_USED_PROJECT_AND_TASK() { return this.replaceLabels(this.getMessage('EXTENSION__LAST_USED_PROJECT_AND_TASK')) },
    get DONE_LABEL() { return this.getMessage('GLOBAL__DONE_LABEL') },
    get ADD_TIME_MANUAL() { return this.getMessage('EXTENSION__ADD_TIME_MANUAL') },
    get SUBMITTING() { return this.getMessage('EXTENSION__SUBMITTING') },

    get EXPAND() { return this.getMessage('EXTENSION__EXPAND') },
    get FAVORITE() { return this.getMessage('EXTENSION__FAVORITE') },

    POMODORO_BREAK_STARTED(minLength) { return this.getMessage('EXTENSION__POMODORO_BREAK_STARTED', [minLength]) },
    get POMODORO_BREAK_ENDED() { return this.getMessage('EXTENSION__POMODORO_BREAK_ENDED') },
    POMODORO_TAKE_BREAK(minLength) { return this.getMessage('EXTENSION__POMODORO_TAKE_BREAK', [minLength]) },
    get POMODORO_TIME_TO_WORK() { return this.getMessage('EXTENSION__POMODORO_TIME_TO_WORK') },
    get CLICK_HERE_TO_START_TIMER() { return this.getMessage('EXTENSION__CLICK_HERE_TO_START_TIMER') },
    get CLICK_HERE_TO_START_BREAK() { return this.getMessage('EXTENSION__CLICK_HERE_TO_START_BREAK') },
    SESSION(number) { return this.getMessage('EXTENSION__POMODORO_SESSION', [number]) },
    POMODORO_TAKE_LONG_BREAK(minutes) { return this.getMessage('EXTENSION__POMODORO_TAKE_LONG_BREAK', [minutes]) },
    get CLICK_HERE_TO_START_LONG_BREAK() { return this.getMessage('EXTENSION__CLICK_HERE_TO_START_LONG_BREAK') },
    get POMODORO_TIMER() { return this.getMessage('EXTENSION__POMODORO_TIMER') },
    REMINDER_MESSAGE(minutes) { return this.getMessage('EXTENSION__REMINDER_MESSAGE', [minutes]) },
    get ADD_MISSING_TIME() { return this.getMessage('EXTENSION__ADD_MISSING_TIME') },
    get DISCARD_IDLE_TIME() { return this.getMessage('EXTENSION__DISCARD_IDLE_TIME') },
    get DISCARD_AND_CONTINUE() { return this.getMessage('EXTENSION__DISCARD_AND_CONTINUE') },
    get IDLE_TIME_DETECTED() { return this.getMessage('EXTENSION__IDLE_TIME_DETECTED') },
    get CLICK_HERE_TO_DISCARD_IDLE() { return this.getMessage('EXTENSION__CLICK_HERE_TO_DISCARD_IDLE') },
    IDLE_MESSAGE(hours, minutes, desc) { return this.getMessage('EXTENSION__IDLE_MESSAGE', [hours, minutes, desc]) },
    IDLE_MESSAGE_MINUTES(minutes, desc) { return this.getMessage('EXTENSION__IDLE_MESSAGE_MINUTES', [minutes, desc]) },

    get REMINDER() { return this.getMessage('EXTENSION__REMINDER') },
    get ENTER_REQUIRED_FIEEDS_OR_EDIT_WORKSPACE_SETTINGS() { return this.getMessage('EXTENSION__ENTER_REQUIRED_FIEEDS_OR_EDIT_WORKSPACE_SETTINGS') },

    get DEPARTMENT() { return this.getMessage('GLOBAL__DEPARTMENT_LABEL') }, 
    get DEPARTMENTS() { return this.getMessage('GLOBAL__DEPARTMENTS_LABEL') }, 
    get CATEGORY() { return this.getMessage('GLOBAL__CATEGORY_LABEL') }, 
    get CATEGORIES() { return this.getMessage('GLOBAL__CATEGORIES_LABEL') }, 
    get LOCATION() { return this.getMessage('GLOBAL__LOCATION_LABEL') }, 
    get LOCATIONS() { return this.getMessage('GLOBAL__LOCATIONS_LABEL') }, 
    get JOB() { return this.getMessage('GLOBAL__JOB_LABEL') }, 
    get JOBS() { return this.getMessage('GLOBAL__JOBS_LABEL') }, 
    get ACTIVITY() { return this.getMessage('GLOBAL__ACTIVITY_LABEL') }, 
    get ACTIVITIES() { return this.getMessage('GLOBAL__ACTIVITIES_LABEL') }, 
    get JOB_AREA() { return this.getMessage('GLOBAL__JOB_AREA_LABEL') }, 
    get JOB_AREAS() { return this.getMessage('GLOBAL__JOB_AREAS_LABEL') }, 
    get START_TIMER_WITH_DESCRIPTION() { return this.getMessage('EXTENSION__START_TIMER_WITH_DESCRIPTION') },
    get WORKSPACE__TWO_FACTOR__MODAL__TITLE() { return this.getMessage('WORKSPACE__TWO_FACTOR__MODAL__TITLE') },
    get WORKSPACE__TWO_FACTOR__MODAL__INFO_MESSAGE() { return this.getMessage('WORKSPACE__TWO_FACTOR__MODAL__INFO_MESSAGE') },
    get WORKSPACE__TWO_FACTOR__MODAL__ENABLE() { return this.getMessage('WORKSPACE__TWO_FACTOR__MODAL__ENABLE') },
    get SCREENSHOT_RECORDING() { return this.getMessage('EXTENSION__SCREENSHOT_RECORDING') },
    get DOWNLOAD_SCREENSHOTS_RECORDING_APP() { return this.getMessage('EXTENSION__DOWNLOAD_SREENSHOTS_RECORDING_APP') },
    get TRACKER__ENTRY_MESSAGES__LOADING() { return this.getMessage('TRACKER__ENTRY_MESSAGES__LOADING') }

}

if(self.clockifyLocales){
    self.aBrowser.storage.local.get(['lang', 'locale_messages'], ({lang, locale_messages}) => {
        self.clockifyLocales.lang = lang;
        self.clockifyLocales.messages = locale_messages;
        self.aBrowser.runtime.sendMessage({
            eventName: "updateContexMenu"
        });
    });

    self.aBrowser.storage.onChanged.addListener((changes) => {
        if (changes.lang) {       
            self.clockifyLocales.lang = changes.lang.newValue;
        }
        if (changes.locale_messages){
            self.clockifyLocales.messages = changes.locale_messages.newValue;
            self.aBrowser.runtime.sendMessage({
                eventName: "updateContexMenu"
            });
        }
    });

}

export default locales;
