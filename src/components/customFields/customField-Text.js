import React from 'react';
import useCustomField from './useCustomField';

const CustomFieldText = ({cf, updateValue}) => {

    const [
        {id, index, value, isDisabled, placeHolder, title, manualMode}, 
        setValue,
        storeValue
    ] = useCustomField(cf, updateValue);

    const handleChange = (e) => {
        const val = e.target.value;
        setValue(val);
    };

    const handleBlur = (e) => {
        e.preventDefault();
        storeValue();
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
                onBlur={handleBlur}
            />
        </div>
    )
}

export default CustomFieldText;