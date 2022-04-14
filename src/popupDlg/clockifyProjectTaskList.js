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
            Items: {},
            loadMore: false,
            renderFrom: 0
        }
        this.pageSize = 50;
    }


    setItems(li2, tasks) {
        const {items} = this.state;
        this.setState({
            li2, 
            renderFrom: items.length,
            items: items.concat(tasks),
            loadMore: tasks.length >= this.pageSize ? true : false
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
                const arr = [];
                const { items } = this.state;
                for (var i=this.state.renderFrom; i < items.length; i++) {
                    const item = items[i];
                    const Item = new ClockifyTaskItem(item);
                    this.state.Items[item.id] = Item;
                    arr.push(Item.render());
                }
                let str = arr.join('')

                if (this.state.loadMore) {
                    str += `<li id='task_li_load_more'><button class='clockify-list-load-tasks'>${clockifyLocales.LOAD_MORE}</button></li>`
                }
                ul.innerHTML += str;
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
