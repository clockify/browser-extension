// ------------
// TagItem
// ------------

var ClockifyTagItem = class {

    constructor(props) {
        this.tag = props.tag;
        this.state = {
            isOpen: props.isOpen,
            isChecked: props.isChecked
        }
    }

    setState(obj) {
        Object.assign(this.state, obj)
        this.renderContent();
    }

    select() {
        this.setState({ isChecked: !this.state.isChecked })
        _clockifyTagList.selectTag(this.tag);
    }

    get Item() {
        return `_clockifyTagList.state.Items['${this.tag.id}']`
    } 

    get InnerHTML() {
        const { isChecked } = this.state;
        const { tag } = this;
        let str = 
            "<div class='clockify-tag-list-item-row'>" +
                `<span class='clockify-tag-list-checkbox${isChecked?" clockify-checked":""}'>` +
                    `<img src='${aBrowser.runtime.getURL('assets/images/checked.png')}' ` +
                    `class='clockify-tag-list-checked${isChecked ? "" : "-hidden"}'/>` +
                "</span>" +
                `<span class='clockify-tag-list-item'>${tag.name}</span>` +
            "</div>";
        return str;
    }
 
    render() {
        const li1 = 
            `<li id='li_${this.tag.id}' class='clockify-tag-item'>` + 
                this.InnerHTML +
            "</li>";
        return li1
    }

    renderContent() { 
        const el = _clockifyTagList.getDropDownPopupElem('#li_'+ this.tag.id);
        el.innerHTML = this.InnerHTML;
    }

    clean() {
    }
}
