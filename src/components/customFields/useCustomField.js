import React, { useState, useEffect, useCallback } from 'react';
import {getBrowser} from '../../helpers/browser-helper'

// Hook
const useCustomField = (cf) => {
  
    const { wsCustomField, timeEntryId, value: initialValue, index, isUserOwnerOrAdmin, redrawCounter, manualMode } = cf;
    const [value, setVal] = useState(initialValue);

    useEffect(() => {
        setVal(initialValue);
    }, [initialValue])

    const { id, name, allowedValues, description, placeholder, 
        projectDefaultValues, required, 
        status, type, workspaceDefaultValue, onlyAdminCanEdit } = wsCustomField;

    const placeHolder = !!placeholder ? placeholder : name.toLowerCase();
    const title = !!description ? description : name.toLowerCase();
    const placeHolderOrName = !placeholder ? name : placeholder;

    const isDisabled = onlyAdminCanEdit && !isUserOwnerOrAdmin;

    const setValue = useCallback(val => {
        setVal(val)
    }, [value]);


    const storeValue = useCallback((val) => {
        getBrowser().runtime.sendMessage({
            eventName: 'submitCustomField',
            options: {
                timeEntryId: timeEntryId,
                customFieldId: id,
                value: val
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
                // setValue(data);
            }
        });
    }, []);
   
    return [ {id, index, value, isDisabled, placeHolder, placeHolderOrName, title, allowedValues, redrawCounter, manualMode }, setValue, storeValue ]
}

export default useCustomField;