var aBrowser = chrome || browser;

var ClockifyPopupDlg = class {
    constructor() {
        this.editForm = null;
        this.wsCustomFields = [];
        this.userRoles = [];
    }    

    create(timeEntry, msg) {

        this.editForm = new ClockifyEditForm(timeEntry);

        _clockifyProjectList = new ClockifyProjectList(this.editForm, timeEntry);
        _clockifyTagList = new ClockifyTagList(this.editForm, timeEntry);

        const popupDlg = document.createElement('div');
        popupDlg.setAttribute("id", 'divClockifyPopupDlg');
        popupDlg.classList.add('clockify-popup-dlg');

        const divEditForm = this.editForm.create(msg);
        popupDlg.appendChild(divEditForm);
        // setTimeout(() => {
        //     this.editForm.setFocusToDescription();
        // }, 500);
        return popupDlg;
    }

    get isOwnerOrAdmin() {
        return this.userRoles.some(row => ['WORKSPACE_ADMIN', 'WORKSPACE_OWN'].includes(row.role));
    }

    getWSCustomField(customField) {
        return this.wsCustomFields.find(cf => cf.id === customField.customFieldId);
    }

    injectLinkModal() {
        if (this.wsCustomFields.some(cf => cf.type === "LINK")) {
            ClockifyCustomFieldLink.injectLinkModal();
        }
    }
    
    onClickedLinkModal(divClockifyLinkModal, target) {
        const index = divClockifyLinkModal.getAttribute("index");
        try {
            this.editForm.customFields[index].onClickedLinkModal(this.editForm.divCustomFields, divClockifyLinkModal, target);
        } 
        catch (e) {
            console.error(e);
        } 
    }

    onClicked(el) {
        while (el && !el.id) {
            el = el.parentNode;
        }
        switch(el.id) {
            case 'imgClockifyDropDown':
            case 'liClockifyProjectDropDownHeader':
                _clockifyProjectList.onClicked(el);
                break;

            case 'imgClockifyDropDownTags':
            case 'liClockifyTagDropDownHeader':
                _clockifyTagList.onClicked(el);
                break;

            case 'aEditCustomFieldLink':
            case 'liClockifyCFDropHeader': {
                const index = el.getAttribute('index');
                try {
                    this.editForm.customFields[index].onClicked(el);
                } 
                catch (e) {
                    console.error(e);
                }
            }

            case 'divClockifyLinkModal':
                break;

            default:
                this.editForm.onClicked(el);
                break;
        }
    }

    onClickedProjectDropDown(el) {
        while (el && !el.id) {
            el = el.parentNode;
        }
        switch(el.id) {
            case 'imgClockifyTasksArrow':
            //case 'clockifyProjectItemTask':
            case 'clockifyProjectItemName':
            case 'clockifyLoadMoreProjects':
            case 'clockifyFavoriteStar':
                _clockifyProjectList.onClickedProjectDropDown(el);
                break;
            default:
                if (el.nodeName === 'LI' && el.id.startsWith('task_li_')) {
                    _clockifyProjectList.onClickedProjectDropDown(el);
                }
                break;
        }
    }

    onClickedTagDropDown(el) {
        while (el && !el.id) {
            el = el.parentNode;
        }
        switch(el.id) {
            default:
                _clockifyTagList.onClickedTagDropDown(el);
                break;
        }
    }

    onClickedCFPopup(target) {
        return this.editForm.onClickedCFPopup(target);
    }

    closeAllDropDowns() {
        if (_clockifyProjectList)
            _clockifyProjectList.close(true);
        if (_clockifyTagList)
            _clockifyTagList.close(true);

        this.editForm.customFields.forEach(customField => {
            if (['DROPDOWN_SINGLE', 'DROPDOWN_MULTIPLE'].includes(customField.type)) {
                customField.close(true);
            }
        })
    }

    repositionDropDownCF() {
        this.editForm.customFields.forEach(customField => {
            if (['DROPDOWN_SINGLE', 'DROPDOWN_MULTIPLE'].includes(customField.type))
                customField.repositionDropDown();
        })
    }



    onChanged(el) {
        this.editForm.onChanged(el);
    }

    destroy() {
        //_clockifyProjectList.setElem(null);
        _clockifyProjectList.destroy();
        _clockifyProjectList = null;
        _clockifyTagList.destroy();
        _clockifyTagList = null;

        this.editForm.customFields.forEach(customField => {
            customField.destroy();
        })        

        this.editForm.destroy();
        this.editForm = null;
    }
   
}


aBrowser.runtime.sendMessage({ eventName: 'takeTimeEntryInProgress' }, (response) => {
    //console.log('Page took current timeEntryInProgress, before CreateButton =>', response)
});