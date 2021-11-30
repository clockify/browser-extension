var _encode_chars  = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;'
}

var ClockifyCustomFieldDropSingle = class extends ClockifyCustomField {

    constructor(obj) {
        super(obj);

        //this.id = `clockifyCustomFieldDropSingle${this.index}`;
        this.popupId = `${this.divId}Popup`;

        this.liHeaderId = 'liClockifyCFDropHeader'
        
        const items = this.allowedValues.map((val, index) => ({ 
            id: index+1, 
            name: val, 
            isChecked: val === this.value
        }));
        items.unshift({ id: 0, name: 'None', isChecked: this.value === null});

        this.elem = null;
        this.divDropDownPopup = null;
        this.state = {
            isOpen: false,
            items,
            ready: false,
            title: '',
            Items: {}
        }
    }

    create() {
        const div = document.createElement('div');
        div.setAttribute("id", `${this.divId}`);
        div.setAttribute("index", `${this.index}`);
        div.setAttribute('class', 'clockify-custom-field');
        div.innerHTML = 
            "<ul class='clockify-drop-down'>" + 
                `<li id='${this.liHeaderId}' index='${this.index}'>${this.HeaderContent}</li>` +
            "</ul>";
        
        this.setElem(div);      
        return div;
    }

    onClickedCFPopup(target) {
        if (this.state.isOpen && this.divDropDownPopup && this.divDropDownPopup.contains(target)) {
            const that = this;
            setTimeout(() => {
                that.onClickedDropDown(target);
            })
            return true; // notify clockifyButton.clockifyClicks that we proccessed click
        }
        return false;
    }


    setElem(elem) {
        this.elem = elem;
    }

    getElem(s) { 
        const el = $(s, this.elem);
        return el;
    }

    setDropDownPopupElem(el) {
        this.divDropDownPopup = el;
    }

    getDropDownPopupElem(s) { 
        const el = $(s, this.divDropDownPopup);
        return el;
    }

    getDropDownPopupElems(s) { 
        const el = $$(s, this.divDropDownPopup);
        return el;
    }

    setState(obj, redraw=false) {
        Object.assign(this.state, obj);
        if (redraw) {
            this.redrawHeader(); //  ???
            if (this.divDropDownPopup) {
                this.renderContent(); // ???
            }
        }
    }


    componentDidMount() {
        //this.getCustomField();
        this.render();
        this.setState({ready: true}, true);         
        this.repositionDropDown();
    }

    repositionDropDown() {
        if (this.divDropDownPopup) {
            const li = this.getElem(`#${this.liHeaderId}`);
            if (li) {
                const rect = li.getBoundingClientRect();
                this.divDropDownPopup.style.setProperty('left', "" + (rect.left + window.scrollX) + "px");  // + 
                this.divDropDownPopup.style.setProperty('top', "" + (rect.bottom + window.scrollY) + "px");        
            }
        }
    }

    encoded(name) {
        const arr = [...name].map(c => _encode_chars[c] ? _encode_chars[c] : c)
        return arr.join('')
    }


    get HeaderContent() {
        const isOffline = !navigator.onLine ? true : false;
        let title = this.name + ':' + name;
        const className = `clockify-tag-list-button${(isOffline||this.isDisabled) ? '-disabled':''}`;
        const img = `assets/images/arrow-light-mode${this.state.isOpen?"-up":""}.png`;
        const str = 
            `<div style='display:flex; align-items: center;' title="${this.title}" tabIndex=0` + 
                ` class='${className}' title="${title}">` +
                `<span` +
                    " class='clockify-tag-list-name'>" + 
                    (!this.value
                        ? "<span class='clockify-tag-list-add'>" + 
                            this.placeholder +
                        "</span>"
                        : "<span class='clockify-tag-list-selected'>" +
                            this.value + 
                        "</span>" ) +
                "</span>" +
                "<span class='clockify-span-arrow'>" +
                    `<img src='${aBrowser.runtime.getURL(img)}'` + 
                    " alt='open' class='clockify-list-arrow' />" + 
                "</span>" + 
            "</div>"
        return str;
    }

    redrawHeader() {
        const li = this.getElem(`#${this.liHeaderId}`);
        if (li)
            li.innerHTML = this.HeaderContent;
        //$('#imgClockifyDropDownTags', this.elem).src = aBrowser.runtime.getURL('assets/images/arrow-light-mode.png');
    }
   
    setValue(value) {
        this.value = value;
    }    

    redrawValue() {
        this.redrawHeader();
    }


    onClicked(el) {
        if (!this.isDisabled) {
            switch(el.id) {
                case this.liHeaderId: 
                {
                    if (!this.state.isOpen) {
                        this.open();
                    }
                    else
                        this.close();
                }
                break;
                
                default:
                    break;
            }
        }
    }

    onClickedDropDown(el) {      
        while (el && !el.id) {
            el = el.parentNode;
        }        
        switch(el.id) {
            default:
                if (el.nodeName === 'LI' && el.id.startsWith('li_')) {
                    const id = el.id.replace("li_", "");
                    this.selectItem(id);
                }
                break;
        }
    }    


    getImg() {
        return this.getElem('img.clockify-list-arrow')
    }

    open() {
        aBrowser.storage.local.get(["timeEntryInProgress"], (result) => {
            _clockifyPopupDlg.closeAllDropDowns();

            const neverOpened = !this.divDropDownPopup;
            if (neverOpened) {
                this.componentDidMount();
            }
            this.getImg().src = aBrowser.runtime.getURL('assets/images/arrow-light-mode-up.png');
            this.divDropDownPopup.style.display = 'block';

            if (neverOpened) {
            }
            this.setState({ 
                isOpen: true 
            });
        });
    }

    close(fromOtherDropDown) {
        if (fromOtherDropDown && !this.state.isOpen)
            return;
        this.setState({ 
            isOpen: false
        });
        this.getImg().src = aBrowser.runtime.getURL('assets/images/arrow-light-mode.png');
        this.divDropDownPopup.style.display = 'none';
    }

    destroy() {
        this.clean();
        if (this.divDropDownPopup) {
            this.divDropDownPopup.removeEventListener('mousewheel', this.clockifyMouseWheel, true);
            this.divDropDownPopup.removeEventListener('DOMMouseScroll', this.clockifyMouseWheel, true);
            document.body.removeChild(this.divDropDownPopup);
            this.divDropDownPopup = null;
        }
        this.elem = null;
        // todo remove click listeners
        //document.removeEventListener('click', removePopupDlg, true);
    }   
  
    render() {
        const dropDownPopup = document.createElement('div');
        dropDownPopup.setAttribute("id", `${this.popupId}`);
        dropDownPopup.classList.add('clockify-drop-down-popup');
        dropDownPopup.innerHTML = 
            "<ul class='clockify-drop-single clockify-tag-list'>" +
            "</ul>";
        this.setDropDownPopupElem(dropDownPopup);

        document.body.appendChild(dropDownPopup);
        //this.getElem('#liClockifyTagDropDown').innerHTML = str;
        this.divDropDownPopup.addEventListener('mousewheel', this.clockifyMouseWheel, true);
        this.divDropDownPopup.addEventListener('DOMMouseScroll', this.clockifyMouseWheel, true);
    }

    clockifyMouseWheel(e) {
        e.stopPropagation();
    }

    renderContent() {
        let str = "";
        const arr = [];
        this.state.items
            .map(item => {
                const Item = new ClockifySingleItem({ pDrop: this, item });
                this.state.Items[item.id] = Item;
                arr.push(Item.render());
            })
        str += arr.join('');
        
        this.getDropDownPopupElem('ul.clockify-drop-single').innerHTML = str;
    }

    getItemElem(id) {
        return $(id, this.divDropDownPopup);
    }


    selectItem(id) {
        const {Items} = this.state;
        let value = null;
        if (Items[id].isChecked)
            return;

        Object.keys(Items).forEach(key => {
            const singleItem = Items[key];
            if (key === id) {                             
                singleItem.select();
                value = id === '0' ? null : singleItem.item.name;
            }
            else {
                // multipleItem.state.isChecked = false;
                singleItem.select(false);
            }
        });

        // Object.keys(Items).forEach(key => { 
        //     const multipleItem = Items[key];
        //     if (multipleItem.state.isChecked) 
        //         value = multipleItem.item.name;
        // });
        this.onChanged(value);
    }

    onChanged(value) {
        aBrowser.runtime.sendMessage({
            eventName: 'submitCustomField',
            options: {
                timeEntryId: this.timeEntryId,
                customFieldId: this.customFieldId,
                value
            }
        }, (response) => {
            if (!response) {
                alert('Error response must be defined');
                return response;
            } 
            const { data, status } = response;
            if (status !== 201) {
                if (status === 400) {
                    alert("Problem with Custom Field Value.");
                }
            } 
            else {
                this.value = value; // data.value, renderContent() is called only one time
                this.redrawHeader();
                this.close();
            }
        });
    } 

    clean() {
        const Items = this.state.Items;
        Object.keys(Items).forEach(key => {
            Items[key].clean();
            Items[key] = null;
        });
        if (this.dropDownPopupElem)  // ever dropped
            this.getElem(`#${this.popupId}`).innerHTML = "";
    }

}