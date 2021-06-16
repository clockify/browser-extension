// ---------
// TaskItem 
// ---------

var ClockifyTaskItem = class {
    constructor(props) {
        this.props = props;
        this.state = {
            name: props.name,
            isOpen: props.isOpen
        }
    }
    
    get Item() {
        return `TaskList.state.Items['${this.props.id}']`
    } 
    
    render() {
        return `<li id='task_li_${this.props.id}' class='clockify-task-item'>${this.state.name}</li>`
    }
}


var ClockifyTaskList = class {
    constructor(props) {
        this.props = props;
        this.state = {
            li2: null,
            items: [], //props.tasks,
            taskCount: props.taskCount,
            Items: {}
        }
    }

    setItems(li2, tasks) {
        this.setState({
            li2, 
            items: tasks
        });
    }

    get nItems() {
        return this.state.items.length
    }
        
    setState(obj) {
        Object.assign(this.state, obj)
        this.renderContent()
    }
    
    render() {
        return "<li class='clockify-project-item-2' style='display: none'><ul class='clockify-task-list'></ul></li>";
    }

    renderContent() {
        if (this.state.items) {
            const ul = $('ul.clockify-task-list', this.state.li2);
            if (ul) {
                const arr = this.state.items.map(item => {
                    const Item = new ClockifyTaskItem(item);
                    this.state.Items[item.id] = Item;
                    return Item.render()
                })
                ul.innerHTML = arr.join('');
            }
        }
    }
    
    closeAll() {
        const Items = this.state.Items;
        Object.keys(Items).forEach(key => { 
            if (Items[key].state.isOpen) Items[key].close()
        });
    } 
    
    toggleTaskList(el, isOpen) {
        el.nextSibling.style.display = isOpen ? 'block' : 'none';
        const img = $('img.clockify-tasks-arrow', el);
        img.src = aBrowser.runtime.getURL(isOpen 
            ? 'assets/images/filter-arrow-down.png'
            : 'assets/images/filter-arrow-right.png');
    }
    
    clean() {
        const Items = this.state.Items;
        Object.keys(Items).forEach(key => Items[key] = null);
    }
}
