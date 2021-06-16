import * as React from 'react';
import {TagService} from "../services/tag-service";
import {SortHepler} from "../helpers/sort-helper";
import {debounce} from "lodash";

const tagService = new TagService();
const sortHelpers = new SortHepler();
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
            isEnabledCreateTag: false,
            createFormOpened: false,
            tagName: "",
            tagIds: this.props.tagIds ? this.props.tagIds : []
        };

        this.filterTags = debounce(this.filterTags, 500);
        this.selectTag = this.selectTag.bind(this);
        this.toggleTagsList = this.toggleTagsList.bind(this);
    }

    componentDidMount(){
        this.isEnabledCreateTag();
    }

    isOpened() {
        return this.state.isOpen;
    }

    closeOpened() {
        this.setState({
            isOpen: false
        });
    }

    getTags(page, pageSize) {
        if(!JSON.parse(localStorage.getItem('offline'))) {
            tagService.getAllTagsWithFilter(page, pageSize, this.state.filter)
                .then(response => {
                    let data = response.data;
                    this.setState({
                        tagsList: sortHelpers.sortArrayByStringProperty(this.state.tagsList.concat(data), 'name'),
                        page: this.state.page + 1,
                        loadMore: data.length === pageSize ? true : false
                    }, () => {
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

    toggleTagsList(e) {
        e.stopPropagation();
        if(!JSON.parse(localStorage.getItem('offline'))) {
            if (!this.state.isOpen && this.state.tagsList.length === 0) {
                this.getTags(this.state.page, pageSize);
            }
            this.setState({
                isOpen: !this.state.isOpen
            }, () => {
                if (this.state.isOpen) {
                    this.props.tagListOpened(true);
                    document.getElementById('tag-filter').focus();
                }
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

    clearTagFilter() {
        this.setState({
            tagsList: [],
            tagsListBackUp: [],
            filter: '',
            page: 1
        }, () => {
            this.getTags(this.state.page, pageSize);
            document.getElementById('tag-filter').value = null;
        });
    }

    loadMoreTags() {
        this.getTags(this.state.page, pageSize);
    }

    selectTag(event) {
        let tag = JSON.parse(event.target.getAttribute('value'));
        this.props.editTag(tag);
    }

    isEnabledCreateTag() {
        this.setState({
            isEnabledCreateTag: !this.props.workspaceSettings.onlyAdminsCreateTag ||
            (this.props.workspaceSettings.onlyAdminsCreateTag && this.props.isUserOwnerOrAdmin) ? true : false
        })
    }

    openCreateTag() {
        this.setState({
            createFormOpened: true
        }, () => {
            this.closeTagsList();
            this.createTagName.focus();
        });
    }

    addTag() {
        let tag = {};

        if (!this.state.tagName) {
            this.props.errorMessage('Name is required.');
            return;
        }
        tag.name = this.state.tagName;

        tagService.createTag(tag).then(response => {
            this.props.editTag(response.data);

            this.setState({
                tagsList: this.state.tagsList.concat(response.data),
                createFormOpened: false,
                tagName: ""
            }, () => {
                this.setState({
                    loadMore: this.state.tagsList.length >= pageSize
                })
            });
        }).catch(error => {
            this.props.errorMessage(error.response.data.message);
        })
    }

    cancel() {
        this.setState({
            tagName: "",
            createFormOpened: false
        });
    }

    handleChange(event) {
        this.setState({
            tagName: event.target.value
        });
    }

    render(){
        const { tags } = this.props;

        let title = '';
        if (tags && tags.length > 0) {
            title = (tags.length > 1 ? 'Tags:\n' : "Tag: ") + tags.map(tag=>tag.name).join('\n')    
        }

        return (
            <div className="tag-list" title={title}>
                <div className={JSON.parse(localStorage.getItem('offline')) ?
                    "tag-list-button-offline" : this.props.tagsRequired ?
                        "tag-list-button-required" : "tag-list-button"}
                     onClick={this.toggleTagsList}
                     tabIndex={"0"} 
                     onKeyDown={e => {if (e.key==='Enter') this.toggleTagsList(e)}}
                >
                    <span className={tags.length === 0 ? "tag-list-add" : "disabled"}>
                        {this.props.tagsRequired ? "Add tags (required)" : "Add tags"}
                    </span>
                    <span className={tags.length > 0 ?
                        "tag-list-selected" : "disabled"}>
                    {
                        tags
                            .map((tag, index, list) => {
                            return(
                                <span key={tag.id} className="tag-list-selected-item">
                                    {tag.name}{index < list.length-1 ? ",": ""}
                                </span>
                            )
                        })
                    }
                    </span>
                    <span className={this.state.isOpen ? 'tag-list-arrow-up' : 'tag-list-arrow'} ></span>
                </div>
                <div id="tagListDropdown"
                     className={this.state.isOpen ? "tag-list-dropdown" : "disabled"}>
                    <div className="tag-list-dropdown--content">
                        <div className="tag-list-input">
                            <div className="tag-list-input--border">
                                <input
                                    placeholder={"Filter tags"}
                                    className="tag-list-filter"
                                    onChange={this.filterTags.bind(this)}
                                    id="tag-filter"
                                />
                                <span className={!!this.state.filter ? "tag-list-filter__clear" : "disabled"}
                                      onClick={this.clearTagFilter.bind(this)}></span>
                            </div>
                        </div>
                        <div className="tag-list-items">
                            {
                                this.state.tagsList.length > 0 ?
                                    this.state.tagsList.map(tag => {
                                        return(
                                            <div onClick={this.selectTag}
                                                key={tag.id}
                                                tabIndex={"0"}
                                                onKeyDown={e => {if (e.key==='Enter') this.selectTag(e)}}
                                                value={JSON.stringify(tag)}
                                                className="tag-list-item-row"
                                            >
                                                <span  value={JSON.stringify(tag)}
                                                   className={this.props.tagIds.includes(tag.id) ?
                                                       "tag-list-checkbox checked" : "tag-list-checkbox"}>
                                                <img src="./assets/images/checked.png"
                                                     value={JSON.stringify(tag)}
                                                     className={this.props.tagIds.includes(tag.id) ?
                                                         "tag-list-checked" : "tag-list-checked-hidden"}/>
                                            </span>
                                                <span  value={JSON.stringify(tag)} className="tag-list-item">{tag.name}
                                            </span>
                                            </div>
                                        )
                                    }) : <span className="tag-list--not_tags">No matching tags</span>
                            }
                        </div>
                        <div className={this.state.loadMore ? "tag-list-load" : "disabled"}
                             onClick={this.loadMoreTags.bind(this)}>Load more
                        </div>
                        <div className={this.state.isEnabledCreateTag ?
                            "tag-list__bottom-padding" : "disabled"}>
                        </div>
                        <div className={this.state.isEnabledCreateTag ?
                            "tag-list__create-tag" : "disabled"}>
                            <span className="tag-list__create-tag--icon"></span>
                            <span onClick={this.openCreateTag.bind(this)}
                                  className="tag-list__create-tag--text">Create new tag</span>
                        </div>
                    </div>
                </div>
                <div className={this.state.createFormOpened ? "tag-list__create-form--open" : "disabled"}>
                    <div className="tag-list__create-form">
                        <div className="tag-list__create-form__title-and-close">
                            <div className="tag-list__create-form--title">
                                Create new tag
                            </div>
                            <span onClick={this.cancel.bind(this)}
                                  className="tag-list__create-form__close"></span>
                        </div>
                        <div className="tag-list__create-form--divider"></div>
                        <input
                            ref={input => {this.createTagName = input;}}
                            className="tag-list__create-form--tag-name"
                            placeholder="Tag name"
                            value={this.state.tagName}
                            onChange={this.handleChange.bind(this)}>
                        </input>
                        <div onClick={this.addTag.bind(this)}
                             className="tag-list__create-form--confirmation_button">Add</div>
                        <span onClick={this.cancel.bind(this)}
                              className="tag-list__create-form--cancel">Cancel</span>
                    </div>
                </div>
            </div>
        )
    }
}

export default TagsList;