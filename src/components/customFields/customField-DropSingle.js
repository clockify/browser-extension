import React, { useState, useEffect, useCallback, useRef } from 'react';
import useCustomField from './useCustomField';
import debounce from 'lodash/debounce';
import {isOffline} from "../check-connection";

const CustomFieldDropSingle = ({ cf, closeOther, updateValue }) => {
    
    //if (!cf.value)
    //    cf.value = [];
  
    const [ {id, index, value, isDisabled, placeHolder, placeHolderOrName, title, allowedValues, redrawCounter, manualMode}, 
            setValue,
            storeValue ] = useCustomField(cf);

    const newList = (val) => {
        const items = allowedValues.map((name, id) => ({ id, name, isChecked: val === name }) );
        items.unshift({ id: -1, name: 'None', isChecked: val === null});
        return items;
    }

    const [isOpen, setOpen] = useState(false);

    const [tagList, setTagList] = useState(allowedValues ? newList(value) : []);

    useEffect(()=> {
        setTagList(newList(value))
    }, [value])

    useEffect(()=> {
        setOpen(false)
    }, [redrawCounter])
    

    const tagsRequired = false;

    const handleChangeDelayed = useRef(debounce(val => {
        updateValue(id, val);
        if (!(manualMode || isOffline())) {
            storeValue(val);
        }
    }, 0));

    const selectTag = (id) => {
        const tag = tagList.find(t => t.id === id);
        const val = id === -1 ? null : tag.name;
        setValue(val);
        handleChangeDelayed.current(val);
        setOpen(false);
    };

    const toggleTagList = (e) => {
        e.stopPropagation();
        if (!isDisabled) {
            const x = !isOpen;
            setOpen(x);
            if (x)
                closeOther(id);
        }
    }

    const _encode_chars  = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;'
    }
    
    const encoded = (name) => {
        const arr = [...name].map(c => _encode_chars[c] ? _encode_chars[c] : c)
        return arr.join('')
    }

    let naslov = name + ":" + (value === null ? "" : value)
    return (
        <div key={id} index={index} className={`custom-field${isDisabled?'-disabled':''}`}>
            <div className="tag-list" title={naslov}>
                <div className={  isDisabled
                        ? "tag-list-button-disabled" 
                        : tagsRequired
                            ? "tag-list-button-required"
                            : "tag-list-button"}
                     onClick={toggleTagList}
                     tabIndex={"0"} 
                     onKeyDown={e => {if (e.key==='Enter') toggleTagList(e)}}
                >
                    <span className='tag-list-name'>
                        { value ? (
                        <span className={"tag-list-selected"}>
                            {tagList
                                .filter(tag => tag.isChecked)
                                .map(tag => 
                                    <span key={tag.id} className="tag-list-selected-item"> 
                                        {tag.name}
                                    </span>
                                )
                            }
                        </span>)
                        : (
                            <span className="tag-list-add">{placeHolder}</span>
                        )
                        }
                    </span>
                        
                    <span className={isOpen ? `tag-list-arrow-up` : `tag-list-arrow`} ></span>
                </div>
                <div id="tagListDropdown" className={isOpen ? "tag-list-dropdown" : "disabled"}>
                    <div className="tag-list-dropdown--content">
                        <div className="tag-list-items">
                            {
                            tagList.length > 0 ?
                                tagList.map(tag => {
                                    return(
                                        // <div 
                                        //     <span value={tag.name} className="tag-list-item">
                                        //         {tag.name}
                                        //     </span>
                                        // </div>
                                        <div 
                                            onClick={() => selectTag(tag.id)}
                                            key={tag.name}
                                            tabIndex={"0"}
                                            onKeyDown={e => {if (e.key==='Enter') selectTag(tag.id)}}
                                            className="tag-list-item-row"
                                        >
                                            <label className="cf-container">{tag.name}
                                                {tag.isChecked && <input type="radio" checked name="cf_radio" onChange={()=>{}} />}
                                                {!tag.isChecked && <input type="radio" name="cf_radio" />}                                               
                                                <span className="checkmark"></span>
                                            </label>
                                        </div>
                                    )
                                }) : <span className="tag-list--not_tags">No matching items</span>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CustomFieldDropSingle;
