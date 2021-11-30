// ------------
// MultipleItem
// ------------

var ClockifyMultipleItem = class {

    constructor({pDrop, item, isChecked }) {
        this.pDrop = pDrop;
        this.item = item;
        this.liId = `li_${item.id}`;
        this.state = {
            isChecked
        }
    }

    setState(obj) {
        Object.assign(this.state, obj)
        this.renderContent();
    }

    select() {
        this.setState({ isChecked: !this.state.isChecked })
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
                `<span class='clockify-tag-list-checkbox${isChecked?" clockify-checked":""}'>` +
                    `<img src='${aBrowser.runtime.getURL('assets/images/checked.png')}' ` +
                    `class='clockify-tag-list-checked${isChecked ? "" : "-hidden"}'/>` +
                "</span>" +
                `<span class='clockify-tag-list-item'>${item.name}</span>` +
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
