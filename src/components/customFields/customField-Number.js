import React, { useState, useEffect, useCallback, useRef } from 'react';
import useCustomField from './useCustomField';
import debounce from 'lodash/debounce';
import {isOffline} from "../check-connection";

const CustomFieldNumber = ({cf, updateValue}) => {
    const [ {id, index, value, isDisabled, placeHolder, title, manualMode}, 
            setValue,
            storeValue ] = useCustomField(cf);

    const handleChangeDelayed = useRef(debounce(async val => {
        // updateValue(id, val);
        const isOff = await isOffline();
        if (!(manualMode || isOff)) {
            storeValue(val);
        }
    }, manualMode ? 0 : 1000));

    const handleChange = (e) => {
        const val = e.target.value;
        setValue(val);
        updateValue(id, val);
        handleChangeDelayed.current(parseFloat(val));
    };

    return (
        <div key={id} index={index} className={`custom-field${isDisabled?'-disabled':''}`}>
            <input 
                type="number"
                index={index}
                value={String(value)}
                className={`custom-field-number${isDisabled?'-disabled':''}`}
                title={title}
                placeholder={placeHolder} 
                disabled={isDisabled}
                onChange={handleChange} 
            />
        </div>
    )
}

export default CustomFieldNumber;