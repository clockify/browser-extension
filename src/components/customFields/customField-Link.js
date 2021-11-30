import React, { useState, useEffect, useCallback, useRef } from 'react';
import useCustomField from './useCustomField';
import debounce from 'lodash/debounce';
import { useOnClickOutside } from './useOnClickOutside'
import {isOffline} from "../check-connection";

const CustomFieldLink = ({cf, updateValue}) => {

    const [ {id, index, value, isDisabled, placeHolder, placeHolderOrName, title, manualMode}, 
            setValue,
            storeValue ] = useCustomField(cf);

    const handleChangeDelayed = useRef(debounce(val => {
        updateValue(id, val);
        if (!(manualMode || isOffline())) {
            storeValue(val);
        }
    }, manualMode ? 0 : 1000));

    const handleChangeStore = (e) => {
        const val = e.target.value;
        setValue(val);
        handleChangeDelayed.current(val);
    };

    const handleChange = (e) => {
        const val = e.target.value;
        setValue(val);
        // handleChangeDelayed.current(val);
    };

    const [valueTemp, setValueTemp] = useState(null);
    const handleChangeTemp = (e) => {
        const val = e.target.value;
        setValueTemp(val);
        // handleChangeDelayed.current(val);
    };

    
    const [valueStay, setValueStay] = useState(value);
    const handleChangeStay = (e) => {
        const val = e.target.value;
        setValueStay(val);
        // handleChangeDelayed.current(val);
    };

    const storeStay = () => {
        setValue(valueStay);
        handleChangeDelayed.current(valueStay);
    }


    const [isModalOpen, setModalOpen] = useState(false);

    const ref = useRef();
    // Call hook passing in the ref and a function to call on outside click
    useOnClickOutside(ref, () => setModalOpen(false));

    const openModal = () => {
        setValueTemp(value);
        setModalOpen(true)
    }

    const closeModal = () => {
        setModalOpen(false)
    }

    const saveModal = () => {
        // storeValue(value);
        setValue(valueTemp);
        setValueStay(valueTemp);
        handleChangeDelayed.current(valueTemp);
        setModalOpen(false);
    }

    return (
        <div>
        <div key={id} index={index} className={`custom-field${isDisabled?'-disabled':''}`}>
            {value ? ( 
                <div className={`custom-field-inner${isDisabled?'-disabled':''}`}>
                    <a href={value} style={{color: '#03a9f4', fontSize:'14px'}} target='_blank' title={title}>{placeHolderOrName}</a>
                    { !isDisabled &&
                        <img 
                            index={index}
                            title={title}
                            src="../../../assets/images/edit-unsynced.png"
                            style={{marginLeft: '8px', width:'14px', height:'14px',cursor:'pointer'}}
                            className={isDisabled?'':'clockify-close-dlg-icon'}
                            onClick={() => openModal()}
                        />
                    }
                </div>
                ) : (
                // <div className={`custom-field-inner${isDisabled?'-disabled':''}`}>
                    <input 
                        name={`txtCustomField${index}`}
                        type="url"
                        index={index}
                        className={`custom-field-link clockify-link-input${isDisabled?'-disabled':''}`}
                        title={title}
                        placeholder={placeHolderOrName}
                        onChange={handleChangeStay}
                        onBlur={storeStay}
                        disabled={isDisabled}
                        value={!!valueStay ? valueStay : ''}
                    />
                // </div>
                )
            } 
        </div>

        { isModalOpen && 
            <div id='divClockifyLinkModal' className='clockify-modal' >
                <div className='clockify-modal-content' ref={ref}>
                    <div className="cl-modal-header">
                        <h1 className="cl-modal-title">Edit link</h1>
                        <button type="button" className="cl-close" onClick={closeModal}>
                            <span aria-hidden="true">
                                <span className='clockify-close'>&times;</span>                  
                            </span>
                        </button>
                    </div>
                    <div className="cl-modal-body">
                        <div className='custom-field-link-label'>{placeHolderOrName}</div>
                        <input 
                            type="url"
                            className='custom-field-link clockify-link-input-modal'
                            placeholder={placeHolderOrName}
                            autoComplete="off"
                            onChange={handleChangeTemp}
                            value={!!valueTemp ? valueTemp : ''}
                        />
                    </div>
                    <div className="cl-modal-footer">
                        <a className="clockify-cancel" onClick={closeModal} disabled="">Cancel</a>
                        <a className="clockify-save" onClick={saveModal} disabled="">SAVE</a>
                    </div>
                </div>
            </div>
        }

        </div>

    )
}

export default CustomFieldLink;