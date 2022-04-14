import React, { useState, useEffect, useCallback } from 'react';
import { offlineStorage } from '../../helpers/offlineStorage';

import CustomField from './customField'
import CustomFieldText from './customField-Text'
import CustomFieldNumber from './customField-Number'
import CustomFieldLink from './customField-Link'
import CustomFieldCheckbox from './customField-Checkbox'
import CustomFieldDropMultiple from './customField-DropMultiple'
import CustomFieldDropSingle from './customField-DropSingle'

export function CustomFieldsContainer({
        timeEntry,
        redrawCustomFields,
        isUserOwnerOrAdmin,
        closeOpenedCounter,
        closeOtherDropdowns,
        manualMode,
        updateCustomFields } 
) {
    const [customFields, setCustomFields] = useState([]);

    const closeOther = useCallback((idMe) => {
        let b = false;
        const arr = [...customFields];
        arr.forEach(cf => {
            const { wsCustomField: { id, type } } = cf;
            if (['DROPDOWN_SINGLE', 'DROPDOWN_MULTIPLE'].includes(type)) {
                if (id != idMe) {
                    cf.redrawCounter++;
                    b = true;
                }
            }
        })
        if (b) {
            setCustomFields(arr);
        }
        // close opened projectList or tagList
        closeOtherDropdowns('customField');
    }, [customFields]);

    useEffect(() => {
        const { customFieldValues, projectId } = timeEntry;
        if (customFieldValues && customFieldValues.length > 0) {
            const arr = [];
            customFieldValues.forEach(item => { // hopefully we have no INACTIVE here
                const { customFieldId, type, value, timeEntryId } = item; // name, 
                const wsCustomField = getWSCustomField(customFieldId);
                let status = wsCustomField.status;
                const { projectDefaultValues } = wsCustomField;
                if (projectDefaultValues && projectDefaultValues.length > 0) {
                    const projectEntry = projectDefaultValues.find(x => x.projectId === projectId);
                    if (projectEntry)
                        status = projectEntry.status;
                }
                if (status === 'VISIBLE') {
                    arr.push({
                        customFieldId, 
                        wsCustomField,
                        timeEntryId,  // assert eq item.timeEntryId
                        value,
                        index: arr.length,
                        isUserOwnerOrAdmin,
                        isVisible: true,
                        redrawCounter: 0,
                        manualMode
                    });
                }
            });
            setCustomFields(arr);
        }
    }, [isUserOwnerOrAdmin]);

    useEffect(() => {
        if (redrawCustomFields > 0) // not on the first render
            onChangeProjectRedrawCustomFields()
    }, [redrawCustomFields])

    
    useEffect(() => {
        if (closeOpenedCounter > 0) {// not on the first render
            let b = false;
            const arr = [...customFields];
            arr.forEach(cf => {
                const {wsCustomField: {type} } = cf;
                if (['DROPDOWN_SINGLE', 'DROPDOWN_MULTIPLE'].includes(type)) {
                    cf.redrawCounter++;
                    b = true;
                }
            })
            if (b) {
                setCustomFields(arr);
            }
        }
    }, [closeOpenedCounter]);


    const getWSCustomField = (customFieldId) => offlineStorage.getWSCustomField(customFieldId);

    const updateValue = (customFieldId, value) => {
        // const cf = getWSCustomField(customFieldId);
        //cf.value = value;
        //setCustomFields(customFields);
        const cf = customFields.find(x => x.customFieldId === customFieldId);
        cf.value = value;
        const arr = customFields.map(({customFieldId, value}) => ({ 
            customFieldId,
            sourceType: 'TIMEENTRY',
            value
        }));
        if (manualMode) {
            updateCustomFields(arr);
        }
        else {
            updateCustomFields(arr);
        }
    }
    
    const onChangeProjectRedrawCustomFields = () => {
        const { customFieldValues, projectId } = timeEntry;
        if (!customFieldValues || customFieldValues.length === 0) 
            return;

        // na nivou projekta moze redefinisati vise od 5 VISIBLE polja, 
        // dok na nivou WS ne vise od 5. 
        const arr = [...customFields];
        arr.forEach(cf => {
            if (!customFieldValues.find(it => it.customFieldId === cf.wsCustomField.id)) {
                if (cf.isVisible) {
                    cf.isVisible = false;
                }
            }
        })

        customFieldValues.forEach(item => { // hopefully we have no INACTIVE here
            let { customFieldDto: wsCustomField, value, timeEntryId, name } = item;
            if (!wsCustomField) {
                if (manualMode) {
                    console.log('do not store on Manual Mode item:', item)
                }
                wsCustomField = getWSCustomField(item.customFieldId);
                console.log('NOT FOUND customFieldDto, took from  getWSCustomField(item.customFieldId)', item)
            }
            if (manualMode) {
                value = wsCustomField.workspaceDefaultValue;
            }
            let status = wsCustomField.status;
            const { projectDefaultValues } = wsCustomField;
            if (projectDefaultValues && projectDefaultValues.length > 0) {
                const projectEntry = projectDefaultValues.find(x => x.projectId === projectId);
                if (projectEntry) {
                    status = projectEntry.status;
                    value = projectEntry.value;
                }
            }
            const cf = arr.find(it => it.wsCustomField.id === wsCustomField.id);
            if (status === 'VISIBLE') {
                if (!cf) {
                    // setCustomFields((prevState) => ([...prevState, { fields }]));
                    arr.push({
                        customFieldId: wsCustomField.id,
                        wsCustomField,
                        timeEntryId,  // assert eq customField.timeEntryId
                        value,
                        index: arr.length,
                        isUserOwnerOrAdmin,
                        redrawCounter: 0,
                        manualMode,
                        isVisible: true
                    })
                }
                else {
                    cf.wsCustomField = wsCustomField;
                    cf.value = value;
                    if (!cf.isVisible)
                        cf.isVisible = true;
                }
            }
            else if (cf) {
                if (cf.isVisible) {
                    cf.isVisible = false
                }
            }
        });
        if (manualMode) { // mozda i ovo  =>   || isOffline()
            const cfs = arr && arr.length > 0
                            ? arr.map(({type, customFieldId, value}) => ({ 
                                customFieldId,
                                sourceType: 'TIMEENTRY',
                                value: type === 'NUMBER' ? parseFloat(value) : value
                            }))
                            : [];
            updateCustomFields(cfs);
        }
        setCustomFields(arr);
    }
    return (
        <div className="custom-fields">
            { customFields
                .filter(cf => cf.isVisible)
                .map(cf => {
                    const { wsCustomField: {id, type} } = cf;
                    switch (type) {
                        case 'TXT':
                            return <CustomFieldText key={id} cf={cf} updateValue={updateValue} />
                            break;
                        case 'NUMBER':
                            return <CustomFieldNumber key={id} cf={cf} updateValue={updateValue} />
                            break;
                        case 'LINK':
                            return <CustomFieldLink key={id} cf={cf} updateValue={updateValue} />
                            break;
                        case 'CHECKBOX':
                            return <CustomFieldCheckbox key={id} cf={cf} updateValue={updateValue} />
                            break;
                        case 'DROPDOWN_SINGLE':
                            return <CustomFieldDropSingle key={id} cf={cf} closeOther={closeOther} updateValue={updateValue} />
                           break;
                        case 'DROPDOWN_MULTIPLE':
                            return <CustomFieldDropMultiple key={id} cf={cf}  closeOther={closeOther} updateValue={updateValue} />
                            break;
                        default:
                            // TODO uncomment
                            console.error('Uncovered custom field type: ' + type)
                            return <CustomField key={id} cf={cf} />
                    }                
                })
            }
        </div>
    )

}