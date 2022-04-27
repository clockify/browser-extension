var _encode_chars  = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;'
}


function sortArrayByStringProperty(array, prop) {
    return array.sort((a,b) => (a[prop].toLowerCase() > b[prop].toLowerCase()) ?
                                 1 : ((b[prop].toLowerCase() > a[prop].toLowerCase()) ? -1 : 0));
}

var ClockifyTagList = class {

    constructor(editForm, timeEntryInProgress) {
        this.editForm = editForm;
        this.elem = null;
        this.divDropDownPopup = null;
        this.state = {
            isOpen: false,
            page: 1,
            pageSize: 50, // service returns 50
            tagList: [],
            filter: '',
            ready: false,
            loadMore: false,
            title: '',
            Items: {},
        }
        this.filterTags = this.filterTags.bind(this);
    }

    get wsSettings() { 
        return this.editForm.wsSettings;
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
        aBrowser.storage.local.get('preTagsList', (result) => {
            const preTagsList = result.preTagsList || [];
            this.setState({
                tagList: sortArrayByStringProperty(preTagsList, 'name'),
                ready: true
            });
            this.setState({}, true);
        });
        this.getTags();
        this.render();
        this.repositionDropDown();
    }

    repositionDropDown() {
        const li = this.getElem('#liClockifyTagDropDownHeader');
        if (li) {
            const rect = li.getBoundingClientRect();
            const divDropDown = document.getElementById('divClockifyTagDropDownPopup');
            divDropDown.style.setProperty('left', "" + (rect.left + window.scrollX) + "px");  // + 
            divDropDown.style.setProperty('top', "" + (rect.bottom + window.scrollY) + "px");        
            // let viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
        }
    }



    encoded(name) {
        const arr = [...name].map(c => _encode_chars[c] ? _encode_chars[c] : c)
        return arr.join('')
    }


    get HeaderContent() {
        const isOffline = !navigator.onLine ? true : false;

        const { tags } = this.editForm.state;

        let title = (tags.length > 1 ? `${clockifyLocales.TAGS}:\n` : `${clockifyLocales.TAG}: `);

        const arr = tags
            .map((tag, index, list) => {
                const name = this.encoded(tag.name);
                title += name + "\n";
                return "<span class='clockify-tag-list-selected-item'>" +
                            name + (index < list.length-1 ? ", ": "") +
                        "</span>"
            });
        const img = `assets/images/arrow-light-mode${this.state.isOpen?"-up":""}.png`;
        const str = 
            "<div style='display:flex; align-items: center;' tabIndex=0" + 
                ` class='${isOffline ? "clockify-tag-list-button-offline" : this.editForm.isTagRequired ?
                        "clockify-tag-list-button-required" : "clockify-tag-list-button"}' title="${title}">` +
                `<span` +
                    " class='clockify-tag-list-name'>" + 
                    (arr.length === 0
                        ? "<span class='clockify-tag-list-add'>" + 
                            (this.editForm.isTagRequired ? `${clockifyLocales.ADD_TAGS} (required)` : clockifyLocales.ADD_TAGS) +
                        "</span>"
                        : "<span class='clockify-tag-list-selected'>" +
                            arr.join('') + 
                        "</span>" ) +
                "</span>" +
                "<span class='clockify-span-arrow' id='imgClockifyDropDownTagsSPAN'>" +
                    `<img id='imgClockifyDropDownTags' src='${aBrowser.runtime.getURL(img)}'` + 
                    " alt='open' class='clockify-tag-list-arrow' />" + 
                "</span>" + 
            "</div>"
        return str;
    }

    redrawHeader() {
        const li = this.getElem('#liClockifyTagDropDownHeader');
        if (li)
            li.innerHTML = this.HeaderContent;
        //$('#imgClockifyDropDownTags', this.elem).src = aBrowser.runtime.getURL('assets/images/arrow-light-mode.png');
    }

    create() {
        //this.mapSelectedTag();
        
        const divTag = document.createElement('div');
        divTag.setAttribute("id", 'divClockifyTagDropDown');
        divTag.setAttribute('class', 'clockify-form-div');
        divTag.innerHTML = 
            "<ul class='clockify-drop-down'>" + 
                `<li id='liClockifyTagDropDownHeader'>${this.HeaderContent}</li>` +
            "</ul>";
        
        this.setElem(divTag);      

        return divTag;
    }

    onClicked(el) {
        switch(el.id) {
            case 'liClockifyTagDropDownHeader': 
            case 'imgClockifyDropDownTags': 
            {
                if (!this.state.isOpen)
                    this.open();
                else
                    this.close();
            }
            break;
            
            default:
                break;
        }
    }

    onClickedTagDropDown(el) {
        switch(el.id) {
            case 'clockifyLoadMoreTags':
                this.loadMoreTags();
                break;
            default:
                //let li = el.parentNode;
                //while (li && li.nodeName !== 'LI') {
                //    li = li.parentNode;
                //}
                // el.classList.contains('clockify-tag-item')
                if (el.nodeName === 'LI' && el.id.startsWith('li_')) {
                    const id = el.id.replace("li_", "");
                    this.selectTagItem(id);
                }
                break;
        }
    }    

    shakeHeader() {
        const li = this.getElem('#liClockifyTagDropDownHeader');
        if (li) {
            li.classList.add('shake-heartache');
            li.addEventListener('animationend', function(e) {
                setTimeout(() => {
                    li.classList.remove('shake-heartache')
                }, 300)
            });
        }
    }


    open() {
        aBrowser.storage.local.get(["timeEntryInProgress"], (result) => {
            _clockifyPopupDlg.closeAllDropDowns();

            const neverOpened = !this.divDropDownPopup;
            if (neverOpened) {
                this.componentDidMount();
            }
            this.getElem('#imgClockifyDropDownTags').src = aBrowser.runtime.getURL('assets/images/arrow-light-mode-up.png');
            this.divDropDownPopup.style.display = 'block';

            if (neverOpened) {
                this.filterTags = clockifyDebounce(this.filterTags, 500);

                const inp = this.getDropDownPopupElem('#inputClockifyTagFilter');
                inp.focus();
                inp.addEventListener('keyup', (e) => {
                    this.filterTags(e)
                })
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
            isOpen: false,
            tagList: [],
            page: 1
        });
        this.getElem('#imgClockifyDropDownTags').src = aBrowser.runtime.getURL('assets/images/arrow-light-mode.png');
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
   
    getTags() {
        // if (this.state.page === 1) {
        //     this.setState({
        //         tagList: !this.wsSettings.forceTags && this.editForm.SelectedTag ?
        //             [{name: 'No tag', id: 'no-tag', color: '#999999', tasks: []}] : []
        //     })
        // }        
        aBrowser.runtime.sendMessage({
            eventName: 'getTags',
            options: { 
                filter: this.state.filter, 
                page: this.state.page, 
                pageSize: this.state.pageSize
            }
        }, (response) => {
            if (!response) {
                alert(clockifyLocales.YOU_MUST_BE_LOGGED_IN_TO_START);
                return;
            }
            else if (typeof response === 'string') {
                alert(response);
                return;
            }
            if (response.status === 400) {
                // openPostStartPopup("Can't start entry without tag/task/description or tags. Please edit your time entry. Please create your time entry using the dashboard or edit your workspace settings.")
                // alert("Can't start entry without tag/task/description or tags. Please edit your time entry. Please create your time entry using the dashboard or edit your workspace settings.");
            } else {
                const pageTags = response.pageTags ? response.pageTags : [];
                if(!this.state.filter && this.state.page === 1){
                    aBrowser.storage.local.set({'preTagsList': pageTags});
                }
                const tagList = this.state.page === 1 ? pageTags : this.state.tagList.concat(pageTags);
                this.setState({
                    tagList: sortArrayByStringProperty(tagList, 'name'),
                    page: this.state.page + 1,
                    ready: true
                });
                this.setState({
                    loadMore: pageTags.length === this.state.pageSize ? true : false
                });
                this.setState({}, true); // redraw
            }
        });
    }   

    filterTags(e) {
        Object.assign(this.state, {
            page: 1,
            filter: e.target.value.toLowerCase()
        });
        this.getTags();
    }

    loadMoreTags() {
        this.getTags();
    }
  
    render() {
        const dropDownPopup = document.createElement('div');
        dropDownPopup.setAttribute("id", 'divClockifyTagDropDownPopup');
        dropDownPopup.classList.add('clockify-drop-down-popup');
        dropDownPopup.innerHTML = 
            "<div class='clockify-list-input'>" + 
                "<div class='clockify-list-input--border'>" + 
                    "<input id='inputClockifyTagFilter' type='text'" +
                        ` placeholder="${clockifyLocales.FIND_TAGS}"` + 
                            " class='clockify-list-filter' style='padding: 3px 0px' />" + 
                    (!!this.state.filter ? "<span class='clockify-list-filter__clear' />" : "") + 
                    //onClick={this.clearTagFilter.bind(this)}></span>
                "</div>" + 
            "</div>" +
            "<ul id='ulClockifyTagDropDown' class='clockify-tag-list'>" +
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
        const tagIds = this.editForm.tagIds;
        this.state.tagList
            .map(tag => {
                const Item = new ClockifyTagItem({ tag, isChecked: tagIds.includes(tag.id) });
                this.state.Items[tag.id] = Item;
                arr.push(Item.render());
            })
        str += arr.join('');

        if (this.state.loadMore) {
            str += `<button class='clockify-list-load' id='clockifyLoadMoreTags'>${clockifyLocales.LOAD_MORE}</button>`;
        }
        
        this.getDropDownPopupElem('#ulClockifyTagDropDown').innerHTML = str;
    }


    selectTagItem(id) {
        //e.stopPropagation();
        this.state.Items[id].select();
    }

    toggleTagItem(id) {
        this.state.Items[id].toggle();
    }

    closeAll() {
        const Items = this.state.Items;
        Object.keys(Items).forEach(key => { 
            if (Items[key].state.isOpen) 
                Items[key].close();
        });
    }


    clean() {
        const Items = this.state.Items;
        Object.keys(Items).forEach(key => {
            Items[key].clean();
            Items[key] = null;
        });
        if (this.dropDownPopupElem)  // ever dropped
            this.getElem('#ulClockifyTagDropDown').innerHTML = "";
    }


    selectTag(tag) {
        this.editForm.editTags(tag)
            .then(({entry, tagList}) => {
                // this.setState({tagList});
                this.redrawHeader();
            }
        );
    }

}

