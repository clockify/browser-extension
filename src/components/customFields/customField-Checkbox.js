import React, { useState, useEffect, useCallback, useRef } from 'react';
import useCustomField from './useCustomField';
import debounce from 'lodash/debounce';
import Switch from 'antd/lib/switch';
import {isOffline} from "../check-connection";

const CustomFieldCheckbox = ({cf, updateValue}) => {

    const [ {id, index, value, isDisabled, placeHolder, placeHolderOrName, title, manualMode}, 
            setValue,
            storeValue ] = useCustomField(cf);

    const handleChangeDelayed = useRef(debounce(val => {
        updateValue(id, val);
        if (!(manualMode || isOffline())) {
            storeValue(val);
        }
    }, 0));

    const handleChange = (e) => {
        setValue(e);
        handleChangeDelayed.current(e);
    };

    return (
        <div key={id} index={index} className={`custom-field${isDisabled?'-disabled':''}`}>
            <div className={`custom-field-inner-checkbox${isDisabled?'-disabled':''}`}>
                {/* <div className="pomodoro__border"></div>
                <div className="pomodoro__box__content"> */}
                    <Switch 
                        id={`switchboxCustomField${index}`}
                        className="pomodoro__switch"
                        checked={value}
                        onChange={handleChange}
                        disabled={isDisabled}
                    />
                    <label className='clockify-switch-label' htmlFor={`switchboxCustomField${index}`} title={title}>{placeHolder?placeHolder: name}</label>
                {/* </div> */}
            </div>
        </div>
    )
}

export default CustomFieldCheckbox;