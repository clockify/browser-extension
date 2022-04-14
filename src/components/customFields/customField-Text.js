import React, { useState, useEffect, useCallback, useRef } from 'react';
import useCustomField from './useCustomField';
import debounce from 'lodash/debounce';
import {isOffline} from "../check-connection";

const CustomFieldText = ({cf, updateValue}) => {

    //useEffect(() => {
        const [
            {id, index, value, isDisabled, placeHolder, title, manualMode}, 
            setValue,
            storeValue
        ] = useCustomField(cf);
    //}, [cf]);

    const handleChangeDelayed = useRef(debounce(async val => {
        // updateValue(id, val);
        const isOff = await isOffline();
        if (!(manualMode || isOff)) {
            storeValue(val);
        }
    }, manualMode ? 1000 : 1000));

    const handleChange = (e) => {
        const val = e.target.value;
        setValue(val);
        updateValue(id, val);
        handleChangeDelayed.current(val);
    };

    return (
        <div key={id} index={index} className={`custom-field-ta${isDisabled?'-disabled':''}`}>
            <textarea 
                index={index}
                rows='1'
                className={`custom-field-text${isDisabled?'-disabled':''}`}
                title={title}
                placeholder={placeHolder} 
                disabled={isDisabled}
                value={!!value ? value : ''}
                onChange={handleChange} 
            />
        </div>
    )
}

export default CustomFieldText;