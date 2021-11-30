// ------------
// ClockifySingleItem
// ------------

var ClockifySingleItem = class {

    constructor({pDrop, item}) {
        this.pDrop = pDrop;
        this.item = item;
        this.liId = `li_${item.id}`;
        this.optionId = `option_${item.id}`;
        this.state = {
            isChecked: item.isChecked
        }
    }

    setState(obj) {
        Object.assign(this.state, obj);
        this.renderContent();
    }

    select(isChecked=null) {
        this.setState({ isChecked: isChecked === null ? !this.state.isChecked : isChecked})
        //_clockifyTagList.selectTag(this.tag);
    }

    // get Item() {
    //     return `_clockifyTagList.state.Items['${this.tag.id}']`
    // } 

    get InnerHTML() {
        const { isChecked } = this.state;
        const { item } = this;
        let str = 
            "<div class='clockify-tag-list-item-row'>" + 
                `<label class="cf-container">${item.name}` +
                    `<input type="radio" ${isChecked?'checked':''} name="cf_radio">` +
                    '<span class="checkmark"></span>' +
                '</label>' +
            "</div>";      
        return str;
    }
 
    render() {
        return `<li id='${this.liId}' class='clockify-tag-item'>${this.InnerHTML}</li>`;
    }

    renderContent() { 
        const el = this.pDrop.getItemElem(`#${this.liId}`);
        el.innerHTML = this.InnerHTML;
    }

    clean() {
    }
}
