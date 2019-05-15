import * as React from 'react';
import {TagService} from "../services/tag-service";

const tagService = new TagService();

class TagsList extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            tagsList: [],
            isOpen: false,
            tagListBackup: []
        }
    }

    componentDidMount(){
        this.getAllTags();
    }

    getAllTags() {
        if(!JSON.parse(localStorage.getItem('offline'))) {
            tagService.getAllTags()
                .then(response => {
                    let data = response.data;
                    this.setState({
                        tagsList: data,
                        tagListBackup: data
                    })
                })
                .catch(() => {
                });
        }
    }

    closeTagsList() {
        this.setState({
            isOpen: false,
            tagsList: this.state.tagListBackup
        }, () => {
            document.getElementById('tag-filter').value = "";
        })
    }

    openTagsList() {
        if(!JSON.parse(localStorage.getItem('offline'))) {
            this.setState({
                isOpen: true
            })
        }
    }

    filterTags() {
        let filter =  document.getElementById('tag-filter').value.toLowerCase();
        let tags = this.state.tagsList.filter(tag => tag.name.toLowerCase() && tag.name.toLowerCase().indexOf(filter) > -1);

        this.setState({
            tagsList: tags
        });

        if(filter === "") {
            this.setState({
                tagsList: this.state.tagListBackup
            })
        }

    }

    selectTag(event) {
        let tag = JSON.parse(event.target.getAttribute('value'));
        this.props.editTag(tag.id);
    }

    render(){

            return (
                <div className="tags-list">
                    <div className={JSON.parse(localStorage.getItem('offline')) ? "tag-list-button-offline" : "tag-list-button"} onClick={this.openTagsList.bind(this)}>
                        <span className={this.props.tagIds.length === 0 ? "tag-list-add" : "disabled"}>Add tags</span>
                        <span className={this.props.tagIds.length > 0 && this.props.tagIds.length < 5 ? "tag-list-selected" : "disabled"}>
                        {
                            this.state.tagsList.filter(tag => this.props.tagIds.indexOf(tag.id) > -1).map(tag => {
                                return(
                                    <span className="tag-list-selected-item">{tag.name}</span>
                                )
                            })
                        }
                        </span>
                        <span className={this.props.tagIds.length > 0 && this.props.tagIds.length > 4 ? "tag-list-selected" : "disabled"}>
                            <span className="tag-list-selected-item">...</span>
                        </span>
                        <span className="tag-list-arrow"></span>
                    </div>
                    <div className={this.state.isOpen ? "tag-list-open" : "disabled"}>
                        <div onClick={this.closeTagsList.bind(this)} className="invisible"></div>
                        <div className="tag-list-dropdown">
                            <div className="tag-list-input">
                                <input
                                    placeholder={"Filter tags"}
                                    className="tag-list-filter"
                                    onChange={this.filterTags.bind(this)}
                                    id="tag-filter"
                                />
                            </div>
                            <div className="tag-list-items">
                                {
                                    this.state.tagsList.map(tag => {
                                        return(
                                            <div onClick={this.selectTag.bind(this)} value={JSON.stringify(tag)} className="tag-list-item-row">
                                                <span  value={JSON.stringify(tag)} className="tag-list-checkbox">
                                                    <img src="./assets/images/checked.png" value={JSON.stringify(tag)} className={this.props.tagIds.indexOf(tag.id) > -1 ? "tag-list-checked" : "tag-list-checked-hidden"}/>
                                                </span>
                                                <span  value={JSON.stringify(tag)} className="tag-list-item">{tag.name}</span>

                                            </div>
                                        )
                                    })
                                }
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
}

export default TagsList;