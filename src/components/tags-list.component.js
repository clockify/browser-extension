import * as React from 'react';
import { SortHepler } from '../helpers/sort-helper';
import { debounce } from 'lodash';
import locales from '../helpers/locales';
import onClickOutside from 'react-onclickoutside';
import { getBrowser } from '../helpers/browser-helper';
import Toaster from './toaster-component';

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
			tagName: '',
			tagIds: this.props.tagIds ? this.props.tagIds : [],
			isOffline: null
		};

		this.tagFilterRef = React.createRef();
		this.tagListDropdownRef = React.createRef();

		this.filterTags = this.filterTags.bind(this);
		this.getTags = debounce(this.getTags.bind(this), 500);
		this.selectTag = this.selectTag.bind(this);
		this.toggleTagsList = this.toggleTagsList.bind(this);
		this.setAsyncStateItems = this.setAsyncStateItems.bind(this);
		this.handleScroll = this.handleScroll.bind(this);
		this.getTagsInitial = this.getTagsInitial.bind(this);
	}

	async setAsyncStateItems() {
		const isOffline = await localStorage.getItem('offline');
		let userRoles = (await localStorage.getItem('userRoles')) || [];
		if (userRoles.length) {
			userRoles = userRoles.map(({ role }) => role);
		}
		await this.getTagsInitial(this.state.page, pageSize);
		this.setState({
			isOffline: JSON.parse(isOffline),
			isEnabledCreateTag:
				!this.props.integrationMode &&
				(this.props.workspaceSettings.entityCreationPermissions?.whoCanCreateTags ===
					'EVERYONE' ||
					userRoles.includes('WORKSPACE_ADMIN')),
		});
	}

	componentDidMount() {
		this.setAsyncStateItems();
	}

	handleClickOutside() {
		if (this.state.isOpen) {
			this.toggleTagsList();
		}
	}

	isOpened() {
		return this.state.isOpen;
	}

	closeOpened() {
		this.setState({
			isOpen: false
		});
	}

	async getTags(page, pageSize) {
		const offline = await localStorage.getItem('offline');
		if (!JSON.parse(offline)) {
			getBrowser()
				.runtime.sendMessage({
					eventName: 'getTags',
					options: { page, pageSize, filter: this.state.filter },
				})
				.then(response => {
					const { data } = response;
					if (response && !data) {
						console.log('getTags error: ', response);
						return;
					}
					const tagsList =
						this.state.page === 1 ? data : this.state.tagsList.concat(data);
					this.setState({
						tagsList: sortHelpers.sortArrayByStringProperty(tagsList, 'name'),
						page: this.state.page + 1,
						loadMore: data.length === pageSize ? true : false
					});
				})
				.catch(() => {
				});
		}
	}

	async getTagsInitial(page, pageSize) {
		const offline = await localStorage.getItem('offline');
		if (!JSON.parse(offline)) {
			getBrowser()
				.runtime.sendMessage({
					eventName: 'getTags',
					options: { page, pageSize, filter: this.state.filter },
				})
				.then(response => {
					const { data } = response;
					if (response && !data) {
						console.log('getTags error: ', response);
						return;
					}
					const tagsList = data;
					this.setState({
						tagsList: sortHelpers.sortArrayByStringProperty(tagsList, 'name')
					});
				})
				.catch(() => {
				});
		}
	}

	closeTagsList() {
		this.tagListDropdownRef.current.scroll(0, 0);
		this.setState(
			{
				isOpen: false,
				tagsList: [],
				page: 1,
				filter: ''
			},
			() => {
				this.getTags(this.state.page, pageSize);
			}
		);
	}

	async toggleTagsList(e) {
		if (e) {
			e.stopPropagation();
		}
		const offline = await localStorage.getItem('offline');
		if (!JSON.parse(offline)) {
			if (!this.state.isOpen && this.state.tagsList.length === 0) {
				this.getTags(this.state.page, pageSize);
			}
			this.setState(
				{
					isOpen: !this.state.isOpen
				},
				() => {
					if (this.state.isOpen) {
						this.tagFilterRef.current.focus();
					} else {
						this.props.onClose?.();
					}
				}
			);
		}
	}

	filterTags(e) {
		this.setState(
			{
				tagsList: [],
				tagsListBackUp: [],
				filter: e.target.value,
				page: 1
			},
			() => {
				this.getTags(this.state.page, pageSize);
			}
		);
	}

	clearTagFilter() {
		this.setState(
			{
				tagsList: [],
				tagsListBackUp: [],
				filter: '',
				page: 1
			},
			() => {
				this.getTags(this.state.page, pageSize);
			}
		);
	}

	loadMoreTags() {
		this.getTags(this.state.page, pageSize);
	}

	selectTag(event) {
		let tag = JSON.parse(event.target.getAttribute('value'));
		this.props.editTag(tag);
	}

	// isEnabledCreateTag() {
	//     this.setState({
	//         isEnabledCreateTag: !this.props.workspaceSettings.onlyAdminsCreateTag ||
	//         (this.props.workspaceSettings.onlyAdminsCreateTag && this.props.isUserOwnerOrAdmin) ? true : false
	//     })
	// }

	openCreateTag() {
		this.setState(
			{
				createFormOpened: true
			},
			() => {
				this.closeTagsList();
				this.createTagName.focus();
			}
		);
	}

	addTag() {
		let tag = {};

		if (!this.state.tagName.trim()) {
			this.props.errorMessage(locales.NAME_IS_REQUIRED);
			return;
		}

		const pattern = /<[^>]+>/;
		const hasWrongChars = tagName => (pattern.test(tagName) ? true : false);

		if (hasWrongChars(this.state.tagName)) {
			return this.props.errorMessage(locales.FORBIDDEN_CHARACTERS);
		}

		tag.name = this.state.tagName;

		getBrowser()
			.runtime.sendMessage({
			eventName: 'createTag',
			options: {
				tag
			}
		})
			.then((response) => {
				if (response.status === 400 && response.message) {
					return this.toaster.toast('error', response.message, 2);
				}

				this.props.editTag(response.data, true);

				this.setState(
					{
						tagsList: this.state.tagsList.concat(response.data),
						createFormOpened: false,
						tagName: ''
					},
					() => {
						this.setState({
							loadMore: this.state.tagsList.length >= pageSize
						});
					}
				);
			})
			.catch(error => {
				this.props.errorMessage(error.response.data.message);
			});
	}

	cancel() {
		this.setState({
			tagName: '',
			createFormOpened: false
		});
	}

	handleChange(event) {
		this.setState({
			tagName: event.target.value
		});
	}

	handleScroll(event) {
		if (event.target.scrollHeight - event.target.scrollTop < 221 && this.state.loadMore) {
			if (this.state.page === 1) {
				this.setState(
					{
						page: 2
					},
					() => {
						this.loadMoreTags();
					}
				);
			} else {
				this.loadMoreTags();
			}
		}
	}

	render() {
		const noMatcingTags = locales.NO_MATCHING('tags');
		const { tags } = this.props;

		let title = '';
		if (tags && tags.length > 0) {
			title = tags
				.map(tag => tag.name)
				.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
				.join('\n');
		}

		return (
			<div className="tag-list">
				<Toaster ref={(instance) => this.toaster = instance} />
				<div
					title={title}
					className={
						this.state.isOffline
							? 'tag-list-button-offline'
							: this.props.tagsRequired
								? 'tag-list-button-required'
								: 'tag-list-button'
					}
					onClick={this.toggleTagsList}
					tabIndex={'0'}
					onKeyDown={e => {
						if (e.key === 'Enter') this.toggleTagsList(e);
					}}>
					<span className={tags.length === 0 ? 'tag-list-add' : 'disabled'}>
						{this.props.tagsRequired
							? `${locales.ADD_TAGS} ${locales.REQUIRED_LABEL}`
							: locales.ADD_TAGS}
					</span>
					<span className={tags.length > 0 ? 'tag-list-selected' : 'disabled'}>
						{tags
							.sort((a, b) =>
								a.name.toLowerCase().localeCompare(b.name.toLowerCase())
							)
							.map((tag, index, list) => {
								return (
									<span key={tag.id} className="tag-list-selected-item">
										{tag.name}
										{index < list.length - 1 ? ',' : ''}
									</span>
								);
							})}
					</span>
					<span
						className={this.state.isOpen ? 'tag-list-arrow-up' : 'tag-list-arrow'}
						style={{
							content: `url(${getBrowser().runtime.getURL(
								'assets/images/' +
									(this.state.isOpen
										? 'arrow-light-mode-up.png'
										: 'arrow-light-mode.png')
							)})`,
						}}></span>
				</div>
				<div
					id="tagListDropdown"
					ref={this.tagListDropdownRef}
					className={this.state.isOpen ? 'tag-list-dropdown' : 'disabled'}>
					<div onScroll={this.handleScroll} className="tag-list-dropdown--content">
						<div className="tag-list-input">
							<div className="tag-list-input--border">
								<input
									placeholder={locales.FIND_TAGS}
									className="tag-list-filter"
									onChange={this.filterTags.bind(this)}
									value={this.state.filter}
									id="tag-filter"
									ref={this.tagFilterRef}
								/>
								<span
									className={
										!!this.state.filter ? 'tag-list-filter__clear' : 'disabled'
									}
									onClick={this.clearTagFilter.bind(this)}></span>
							</div>
						</div>
						<div className="tag-list-items">
							{this.state.tagsList.length > 0 ? (
								this.state.tagsList.map((tag, index) => {
									return (
										<div key={index}>
											{tag && (
												<div
													data-pw={`tag-list-item-${index}`}
													onClick={this.selectTag}
													key={tag?.id}
													tabIndex={'0'}
													onKeyDown={e => {
														if (e.key === 'Enter') this.selectTag(e);
													}}
													value={JSON.stringify(tag)}
													className="tag-list-item-row">
													<span
														value={JSON.stringify(tag)}
														className={
															this.props.tagIds.includes(tag.id)
																? 'tag-list-checkbox checked'
																: 'tag-list-checkbox'
														}>
														<img
															src={getBrowser().runtime.getURL(
																'assets/images/checked.png'
															)}
															value={JSON.stringify(tag)}
															className={
																this.props.tagIds.includes(tag.id)
																	? 'tag-list-checked'
																	: 'tag-list-checked-hidden'
															}
														/>
													</span>
													<span
														value={JSON.stringify(tag)}
														className="tag-list-item">
														{tag.name}
													</span>
												</div>
											)}
										</div>
									);
								})
							) : (
								<span className="tag-list--not_tags">{noMatcingTags}</span>
							)}
						</div>
						<div
							className={
								this.state.isEnabledCreateTag
									? 'tag-list__bottom-padding'
									: 'disabled'
							}></div>
						<div
							className={
								this.state.isEnabledCreateTag ? 'tag-list__create-tag' : 'disabled'
							}>
							<span
								className="tag-list__create-tag--icon"
								style={{
									content: `url(${getBrowser().runtime.getURL(
										'assets/images/create.png'
									)})`,
								}}></span>
							<span
								onClick={this.openCreateTag.bind(this)}
								className="tag-list__create-tag--text">
								{locales.CREATE_NEW_TAG}
							</span>
						</div>
					</div>
				</div>
				<div
					className={
						this.state.createFormOpened ? 'tag-list__create-form--open' : 'disabled'
					}>
					<div className="tag-list__create-form">
						<div className="tag-list__create-form__title-and-close">
							<div className="tag-list__create-form--title">
								{locales.CREATE_NEW_TAG}
							</div>
							<span
								onClick={this.cancel.bind(this)}
								className="tag-list__create-form__close"></span>
						</div>
						<div className="tag-list__create-form--divider"></div>
						<input
							ref={input => {
								this.createTagName = input;
							}}
							className="tag-list__create-form--tag-name"
							placeholder={locales.TAG_NAME}
							value={this.state.tagName}
							onChange={this.handleChange.bind(this)}></input>
						<div
							onClick={this.addTag.bind(this)}
							className="tag-list__create-form--confirmation_button">
							{locales.ADD}
						</div>
						<span
							onClick={this.cancel.bind(this)}
							className="tag-list__create-form--cancel">
							{locales.CANCEL}
						</span>
					</div>
				</div>
			</div>
		);
	}
}

export default onClickOutside(TagsList);
