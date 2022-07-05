import React from 'react';
import useCustomField from './useCustomField';

const CustomFieldNumber = ({cf, updateValue}) => {
    const [ {id, index, value, isDisabled, placeHolder, title, manualMode}, 
            setValue,
            storeValue ] = useCustomField(cf, updateValue);

    const handleChange = (e) => {
        const val = e.target.value;
        if(val){
            setValue(parseFloat(val));
        }
        // updateValue(id, val);
        // handleChangeDelayed.current(parseFloat(val));
    };

    const handleBlur = (e) => {
        e.preventDefault();
        storeValue();
    };

    return (
        <div key={id} index={index} className={`custom-field${isDisabled?'-disabled':''}`}>
            <input 
                type="number"
                index={index}
                value={value ? String(value) : ''}
                className={`custom-field-number${isDisabled?'-disabled':''}`}
                title={title}
                placeholder={placeHolder} 
                disabled={isDisabled}
                onChange={handleChange} 
                onBlur={handleBlur}
            />
        </div>
    )
}

export default CustomFieldNumber;