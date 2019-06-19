import * as React from 'react';
import {TagService} from "../services/tag-service";
import {SortHeplers} from "../helpers/sort-helpers";
import {debounce} from "lodash";

const tagService = new TagService();
const sortHelpers = new SortHeplers();
const pageSize = 50;

class TagsList extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            tagsList: [],
            isOpen: false,
            page: 1,
            filter: '',
            loadMore: true,
        };

        this.filterTags = debounce(this.filterTags, 500);
    }

    componentDidMount(){
        this.getTags(this.state.page, pageSize);
    }

    getTags(page, pageSize) {
        if(!JSON.parse(localStorage.getItem('offline'))) {
            tagService.getAllTagsWithFilter(page, pageSize, this.state.filter)
                .then(response => {
                    let data = response.data;
                    this.setState({
                        tagsList: sortHelpers.sortArrayByStringProperty(this.state.tagsList.concat(data), 'name'),
                        page: this.state.page + 1
                    }, () => {
                        this.setState({
                            loadMore: data.length === pageSize ? true : false
                        });
                    });
                })
                .catch(() => {
                });
        }
    }

    closeTagsList() {
        document.getElementById('tagListDropdown').scroll(0, 0);
        this.setState({
            isOpen: false,
            tagsList: [],
            page: 1
        }, () => {
            document.getElementById('tag-filter').value = "";
            this.getTags(this.state.page, pageSize);
        })
    }

    openTagsList() {
        if(!JSON.parse(localStorage.getItem('offline'))) {
            this.setState({
                isOpen: true
            }, () => {
               document.getElementById('tag-filter').focus();
            });
        }
    }

    filterTags() {
        this.setState({
            tagsList: [],
            tagsListBackUp: [],
            filter: document.getElementById('tag-filter').value.toLowerCase(),
            page: 1
        }, () => {
            this.getTags(this.state.page, pageSize);
        });
    }

    loadMoreTags() {
        this.getTags(this.state.page, pageSize);
    }

    selectTag(event) {
        let tag = JSON.parse(event.target.getAttribute('value'));
        this.props.editTag(tag.id);
    }

    render(){

            return (
                <div className="tags-list">
                    <div className={JSON.parse(localStorage.getItem('offline')) ?
                                        "tag-list-button-offline" : "tag-list-button"}
                         onClick={this.openTagsList.bind(this)}>
                        <span className={this.props.tagIds.length === 0 ? "tag-list-add" : "disabled"}>Add tags</span>
                        <span className={this.props.tagIds.length > 0 && this.props.tagIds.length < 5 ?
                                            "tag-list-selected" : "disabled"}>
                        {
                            this.state.tagsList.filter(tag => this.props.tagIds.indexOf(tag.id) > -1).map(tag => {
                                return(
                                    <span className="tag-list-selected-item">{tag.name}</span>
                                )
                            })
                        }
                        </span>
                        <span className={this.props.tagIds.length > 0 && this.props.tagIds.length > 4 ?
                                            "tag-list-selected" : "disabled"}>
                            <span className="tag-list-selected-item">...</span>
                        </span>
                        <span className="tag-list-arrow"></span>
                    </div>
                    <div className={this.state.isOpen ? "tag-list-open" : "disabled"}>
                        <div onClick={this.closeTagsList.bind(this)} className="invisible"></div>
                        <div id="tagListDropdown"
                             className="tag-list-dropdown">
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
                                            <div onClick={this.selectTag.bind(this)}
                                                 value={JSON.stringify(tag)}
                                                 className="tag-list-item-row">
                                                <span  value={JSON.stringify(tag)} className="tag-list-checkbox">
                                                    <img src="./assets/images/checked.png"
                                                         value={JSON.stringify(tag)}
                                                         className={this.props.tagIds.indexOf(tag.id) > -1 ?
                                                             "tag-list-checked" : "tag-list-checked-hidden"}/>
                                                </span>
                                                <span  value={JSON.stringify(tag)} className="tag-list-item">{tag.name}
                                                </span>
                                            </div>
                                        )
                                    })
                                }
                            </div>
                            <div className={this.state.loadMore ? "tag-list-load" : "disabled"}
                                 onClick={this.loadMoreTags.bind(this)}>Load more
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
}

export default TagsList;