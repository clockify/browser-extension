import React, { useState, useEffect, useCallback } from 'react';
import {getBrowser} from '../../helpers/browser-helper'

// Hook
const useCustomField = (cf, updateValue) => {
    
    const { wsCustomField, timeEntryId, value: initialValue, index, isUserOwnerOrAdmin, redrawCounter, manualMode } = cf;
    const [value, setValue] = useState(initialValue);
    const [isFirstCall, setFirstCall] = useState(true);
    // useEffect(() => {
    //     setVal(initialValue);
    // }, [initialValue])

    const { id, name, allowedValues, description, placeholder, 
        projectDefaultValues, required, 
        status, type, workspaceDefaultValue, onlyAdminCanEdit } = wsCustomField;

    const placeHolder = !!placeholder ? placeholder : name.toLowerCase();
    const title = !!description ? description : name.toLowerCase();
    const placeHolderOrName = !placeholder ? name : placeholder;

    const isDisabled = onlyAdminCanEdit && !isUserOwnerOrAdmin;

    // const setValue = val => {
    //     console.log('set value', val);
    //     setVal(val)
    // };


    const storeValue = useCallback(() => {
        console.log('store value', value);
        getBrowser().runtime.sendMessage({
            eventName: 'submitCustomField',
            options: {
                timeEntryId: timeEntryId,
                customFieldId: id,
                value
            }
        }, (response) => {
            if (!response) {
                console.log('Error response must be defined');
                return response;
            } 
            const { data, status } = response;
            if (status !== 201) {
                if (status === 400) {
                    console.log("Problem with Custom Field Value.");
                }
            }
            else {
                updateValue(id, value);
                // setValue(data);
            }
        });
    }, [value]);

    useEffect(() => {
        if (!isFirstCall && (wsCustomField.type === 'CHECKBOX' || wsCustomField.type === 'LINK' || wsCustomField.type === 'DROPDOWN_SINGLE')) {
            storeValue();
        }
        if (isFirstCall) {
            setFirstCall(false);
        }
    }, [value]);
   
    return [ {id, index, value, isDisabled, placeHolder, placeHolderOrName, title, allowedValues, redrawCounter, manualMode }, setValue, storeValue ]
}

export default useCustomField;