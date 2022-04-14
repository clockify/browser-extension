import React, { useState, useEffect, useCallback, useRef } from 'react';
import useCustomField from './useCustomField';
import debounce from 'lodash/debounce';
import {isOffline} from "../check-connection";
import locales from "../../helpers/locales";

const CustomFieldDropMultiple = ({cf, closeOther, updateValue}) => {

    if (!cf.value)
        cf.value = [];

  
    const [ {id, index, value, isDisabled, placeHolder, placeHolderOrName, title, allowedValues, redrawCounter, manualMode}, 
            setValue,
            storeValue ] = useCustomField(cf);

    const newList = (val) => allowedValues.map((name, id) => ({ id, name, isChecked: val.includes(name) }) );

    const [isOpen, setOpen] = useState(false);

    const [tagList, setTagList] = useState(allowedValues ? newList(value) : []);

    useEffect(()=> {
        setTagList(newList(value))
    }, [value])

    const tagsRequired = false;

    const handleChangeDelayed = useRef(debounce(async val => {
        updateValue(id, val);
        const isOff = await isOffline();
        if (!(manualMode || isOff)) {
            storeValue(val);
        }
    }, manualMode ? 0 : 1000));

    useEffect(()=> {
        setOpen(false)
    }, [redrawCounter])


    const selectTag = (id) => {
        const tag = tagList.find(t => t.id === id);
        const val = value.includes(tag.name) 
            ? value.filter(name => name !== tag.name)
            : [...value, tag.name]
        setValue(val);
        handleChangeDelayed.current(val);
    };

    const toggleTagList = (e) => {
        e.stopPropagation();
        if (!isDisabled) {
            // if (!isOpen && tagList.length === 0) {
            //     setTagList(value);
            // }
            //if (!isOpen)
            //    dropMultipleOpened();
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


    let naslov = '';
    if (value && value.length > 0) {
        naslov = (value.length > 1 ? `${locales.TAGS}:\n` : `${locales.TAG}: `) + value.join('\n')
    }
    const noMatcingItems = locales.NO_MATCHING('items');

    return (
        <div key={id} index={index} className={`custom-field${isDisabled?'-disabled':''}`}>
            <div className="tag-list" title={naslov}>
                <div className={isDisabled 
                        ? "tag-list-button-disabled" 
                        : tagsRequired
                            ? "tag-list-button-required"
                            : "tag-list-button"}
                     onClick={toggleTagList}
                     tabIndex={"0"} 
                     onKeyDown={e => {if (e.key==='Enter') toggleTagList(e)}}
                >
                     <span className='tag-list-name'>
                        { value.length > 0 ? (
                        <span className={"tag-list-selected"}>
                            {tagList
                                .filter(tag => tag.isChecked)
                                .map((tag, index, list) => 
                                    <span key={tag.id} className="tag-list-selected-item"> 
                                        {tag.name}{index < list.length-1 ? ",": ""}
                                    </span>
                                )
                            }
                        </span>)
                        : (
                            <span className="tag-list-add">{placeHolder}</span>
                        )
                        }
                    </span>

                    <span className={isOpen ? 'tag-list-arrow-up' : 'tag-list-arrow'} ></span>
                </div>
                <div id="tagListDropdown" className={isOpen ? "tag-list-dropdown" : "disabled"}>
                    <div className="tag-list-dropdown--content">
                        <div className="tag-list-items">
                            {
                            tagList.length > 0 ?
                                tagList.map(tag => {
                                    return(
                                        <div 
                                            onClick={() => selectTag(tag.id)}
                                            key={tag.name}
                                            tabIndex={"0"}
                                            onKeyDown={e => {if (e.key==='Enter') selectTag(tag.id)}}
                                            className="tag-list-item-row"
                                        >
                                            <span value={tag.name} className={tag.isChecked 
                                                    ? "tag-list-checkbox checked"
                                                    : "tag-list-checkbox"
                                            }>
                                                <img src="../assets/images/checked.png"
                                                        value={tag.name}
                                                        className={tag.isChecked 
                                                            ? "tag-list-checked"
                                                            : "tag-list-checked-hidden"}
                                                />
                                            </span>
                                            <span value={tag.name} className="tag-list-item">
                                                {tag.name}
                                            </span>
                                        </div>
                                    )
                                }) : <span className="tag-list--not_tags">{noMatcingItems}</span>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CustomFieldDropMultiple;
