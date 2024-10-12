import React from 'react';
import onClickOutside from 'react-onclickoutside';
import ProjectItem from './project-item.component';
import { debounce } from 'lodash';

import { getDefaultProjectEnums } from '~/enums/default-project.enum';
import { DefaultProject } from '~/helpers/storageUserWorkspace';
import locales from '../helpers/locales';
import { getBrowser } from '~/helpers/browser-helper';
import { mapStateToProps } from '~/zustand/mapStateToProps';

const pageSize = 50;

const _lastUsedProject = {
	id: getDefaultProjectEnums().LAST_USED_PROJECT,
	name: 'Last used project',
	getLocale: () => locales.LAST_USED_PROJECT,
	favorite: false,
	color: '#999999',
	tasks: [],
	client: {
		name: 'ON-TOP'
	}
};

const _lastUsedProjectAndTask = {
	id: getDefaultProjectEnums().LAST_USED_PROJECT,
	name: 'Last used project and task',
	getLocale: () => locales.LAST_USED_PROJECT_AND_TASK,
	favorite: false,
	color: '#999999',
	tasks: [],
	client: {
		name: 'ON-TOP'
	}
};

class DefaultProjectList extends React.PureComponent {
	constructor(props) {
		super(props);

		const { forceProjects, forceTasks } = this.props.workspaceSettings;
		this.initProjectList = [_lastUsedProject, _lastUsedProjectAndTask];
		if (forceTasks) this.initProjectList = [_lastUsedProjectAndTask];

		let { selectedProject } = this.props;
		if (selectedProject) {
			if (selectedProject.id === _lastUsedProject.id) {
				if (forceTasks || selectedProject.name.includes('task')) {
					selectedProject = _lastUsedProjectAndTask;
				} else {
					selectedProject = _lastUsedProject;
				}
			} else if (
				forceTasks &&
				!(selectedProject.selectedTask && selectedProject.selectedTask.id)
			) {
				selectedProject = _lastUsedProjectAndTask;
			}
		}

		this.state = {
			isOpen: false,
			selectedProject,
			selectedTaskName:
				selectedProject && selectedProject.selectedTask
					? selectedProject.selectedTask.name
					: '',
			projectList: this.initProjectList,
			page: 1,
			loadMore: true,
			clientProjects: { withoutClient: [] },
			title: '',
			filter: '',
			specFilterNoTasksOrProject: '',
			// project
			forceProjects,
			projectRequired: false,
			projectArchived: false,
			projectDoesNotExist: false,
			// task
			forceTasks,
			taskDoesNotExist: false,
			taskRequired: false,
			taskDone: false,
			msg: null,
			offline: null
		};

		this.getProjectsDebounced = debounce(this.getProjects, 500);
		this.openProjectDropdown = this.openProjectDropdown.bind(this);
		this.checkDefaultProjectTask = this.checkDefaultProjectTask.bind(this);
		this.clearProjectFilter = this.clearProjectFilter.bind(this);
		this.setAsyncStateItems = this.setAsyncStateItems.bind(this);
		this.projectFilterRef = null;
		this.projectDropdownRef = null;
		this.handleScroll = this.handleScroll.bind(this);
	}

	async setAsyncStateItems() {
		const userSettings = await localStorage.getItem('userSettings');
		const isSpecialFilter = userSettings
			? JSON.parse(userSettings).projectPickerSpecialFilter
			: false;

		const darkMode = this.props.isCurrentUserDarkTheme();
		_lastUsedProject.color = this.getColorForProject(darkMode);
		_lastUsedProjectAndTask.color = this.getColorForProject(darkMode);
		const preProjectList = {};
		let { projectList = [], clientProjects = {} } = preProjectList;
		if (this.state.forceTasks) {
			projectList = projectList.filter((project) => project.taskCount > 0);
		}
		projectList = [...this.initProjectList, ...projectList];
		if (!preProjectList?.clientProjects) {
			clientProjects = this.getClients(projectList);
		}
		this.setState({
			projectList,
			clientProjects,
			isSpecialFilter
		});
	}

	componentDidMount() {
		this.setState({
			title: this.createTitle()
		});
		this.setAsyncStateItems();
	}

	async componentDidUpdate(prevProps, prevState) {
		const offline = await localStorage.getItem('offline');
		const projectsAreObjects =
			this.props.selectedProject && prevProps.selectedProject;
		const projectsAreDifferent =
			projectsAreObjects &&
			(this.props.selectedProject.name !== prevProps.selectedProject.name ||
				(this.props.selectedProject.selectedTask &&
					this.props.selectedProject.selectedTask.name !==
					prevProps.selectedProject.selectedTask.name));
		if (
			projectsAreDifferent ||
			(!projectsAreObjects &&
				this.props.selectedProject &&
				!this.state.selectedProject)
		) {
			let selectedProject = { ...this.props.selectedProject };
			if (this.props.selectedProject) {
				if (this.props.selectedProject.id === _lastUsedProject.id) {
					if (this.props.selectedProject.name.includes('task')) {
						selectedProject = _lastUsedProjectAndTask;
					} else {
						selectedProject = _lastUsedProject;
					}
				}
			}
			this.setState(
				{
					selectedProject,
					selectedTaskName:
						this.props.selectedProject &&
						this.props.selectedProject.selectedTask
							? this.props.selectedProject.selectedTask.name || null
							: null
				},
				() => {
					if (this.props.selectedProject.id !== _lastUsedProject.id) {
						this.checkDefaultProjectTask();
					}
				}
			);
		}
		if (offline !== prevState.offline) {
			this.setState({ offline });
		}
	}

	async checkDefaultProjectTask() {
		const { isPomodoro } = this.props;
		const { forceProjects, forceTasks, projectPickerSpecialFilter } =
			this.props.workspaceSettings;
		const { defaultProject } = await DefaultProject.getStorage(isPomodoro);
		if (!defaultProject) return;
		const { taskDB, msg, msgId } = await defaultProject.getProjectTaskFromDB(
			true
		);

		const projectDoesNotExist =
			forceProjects && msgId === 'projectDoesNotExist';
		const projectArchived = forceProjects && msgId === 'projectArchived';
		const projectRequired = projectDoesNotExist || projectArchived;

		const taskDoesNotExist = forceTasks && msgId === 'taskDoesNotExist';
		const taskDone = forceTasks && msgId === 'taskDone';
		const taskRequired = taskDoesNotExist || taskDone;

		this.setState(
			{
				forceProjects,
				projectDoesNotExist,
				projectArchived,
				projectRequired,
				forceTasks,
				taskDoesNotExist,
				taskDone,
				taskRequired,
				projectPickerSpecialFilter,
				msg,
				selectedTaskName: taskDB ? taskDB.name : ''
			},
			() => {
				this.setState({
					title: this.createTitle()
				});
			}
		);
	}

	isOpened() {
		return this.state.isOpen;
	}

	// closeOpened() {
	//     this.setState({
	//         isOpen: false
	//     });
	// }

	async getProjects(pageSize) {
		const offline = await localStorage.getItem('offline');
		if (!JSON.parse(offline)) {
			const { filter, forceTasks, projectList, isSpecialFilter, page } =
				this.state;
			const alreadyIds = page === 1 ? [] : projectList.map((p) => p.id);
			getBrowser()
				.runtime.sendMessage({
				eventName: 'getProjects',
				options: {
					filter,
					page,
					pageSize,
					forceTasks,
					alreadyIds
				}
			})
				.then((response) => {
					const projects = response.data;
					this.setState(
						{
							projectList:
								page === 1
									? [...this.initProjectList, ...projects]
									: [...projectList, ...projects],
							page: response.page ? response.page + 1 : page + 1
						},
						() => {
							const { filter, projectList } = this.state;
							this.setState({
								clientProjects: this.getClients(projectList),
								loadMore: response.data.length === pageSize,
								specFilterNoTasksOrProject:
									this.createMessageForNoTaskOrProject(
										projects,
										isSpecialFilter,
										filter
									)
							});
						}
					);
				})
				.catch(() => {
				});
		}
	}

	createMessageForNoTaskOrProject(projects, isSpecialFilter, filter) {
		if (!isSpecialFilter || filter.length === 0 || projects.length > 0)
			return '';

		const noMatcingTasks = locales.NO_MATCHING('tasks');
		const noMatcingTProjects = locales.NO_MATCHING('projects');
		const monkeySearch = locales.MONKEY_SEARCH;
		if (!filter.includes('@')) {
			return `${noMatcingTasks}. ${monkeySearch}`;
		} else {
			return noMatcingTProjects;
		}
	}

	async getProjectTasks(projectId, filter, page) {
		return getBrowser().runtime.sendMessage({
			eventName: 'getProjectTasks',
			options: {
				projectId,
				filter,
				page
			}
		});
	}

	async makeProjectFavorite(projectId) {
		return getBrowser().runtime.sendMessage({
			eventName: 'makeProjectFavorite',
			options: {
				projectId
			}
		});
	}

	removeProjectAsFavorite(projectId) {
		return getBrowser().runtime.sendMessage({
			eventName: 'removeProjectAsFavorite',
			options: {
				projectId
			}
		});
	}

	groupByClientName(objectArray) {
		return objectArray.reduce((acc, p) => {
			const key = p.client && !!p.client.name ? p.client.name : 'withoutClient';
			if (!acc[key]) {
				acc[key] = [];
			}
			// Add object to list for given key's value
			acc[key].push(p);
			return acc;
		}, {});
	}

	getClients(projects) {
		const { projectFavorites } = this.props.workspaceSettings;
		if (projectFavorites) {
			const clientProjects = this.groupByClientName(
				projects.filter((p) => !p.favorite)
			);
			const favorites = projects.filter((p) => p.favorite);
			if (favorites.length > 0) {
				clientProjects['FAVORITES'] = favorites;
			}
			return clientProjects;
		} else {
			return this.groupByClientName(projects);
		}
	}

	selectProject(project) {
		this.props.selectProject(project);
		this.setState({ isOpen: false });
	}

	selectTask(task, project) {
		this.selectProject(Object.assign(project, { selectedTask: task }));
	}

	async openProjectDropdown(e) {
		e.stopPropagation();
		const offline = await localStorage.getItem('offline');
		if (!JSON.parse(offline)) {
			this.setState(
				{
					isOpen: true,
					filter: '',
					page: 1
				},
				() => {
					this.projectFilterRef.focus();
					this.getProjects(pageSize);
					this.props.projectListOpened();
				}
			);
		}
	}

	closeProjectList() {
		this.projectDropdownRef.scroll(0, 0);
		this.setState(
			{
				isOpen: false,
				filter: ''
			},
			() => {
			}
		);
	}

	filterProjects(e) {
		this.setState(
			{
				filter: e.target.value,
				page: 1
			},
			() => {
				this.getProjectsDebounced(pageSize);
			}
		);
	}

	loadMoreProjects() {
		this.getProjects(pageSize);
	}

	createTitle() {
		const { selectedProject, selectedTaskName } = this.state;
		let title = `${locales.SELECT} ${locales.DEFAULT_PROJECT}`;

		if (selectedProject && selectedProject.id) {
			title =
				`${locales.PROJECT}: ` +
				(selectedProject.getLocale?.() ||
					selectedProject.name);

			if (selectedTaskName) {
				title = title + `\n${locales.TASK}: ` + selectedTaskName;
			}

			if (
				selectedProject.client &&
				selectedProject.client.name &&
				selectedProject.client.name !== 'ON-TOP'
			) {
				title = title + `\n${locales.CLIENT}: ` + selectedProject.client.name;
			}
		}

		return title;
	}

	clearProjectFilter() {
		this.setState(
			{
				filter: '',
				page: 1
			},
			() => {
				this.getProjects(pageSize);
			}
		);
	}

	getColorForProject(darkMode) {
		return darkMode ? '#90A4AE' : '#999999';
	}

	handleClickOutside() {
		if (this.state.isOpen) {
			this.closeProjectList();
		}
	}

	handleScroll(event) {
		const { loadMore } = this.state;
		const bottom =
			event.target.scrollHeight - event.target.scrollTop ===
			event.target.clientHeight;
		if (bottom && loadMore) {
			this.loadMoreProjects();
		}
	}

	render() {
		const {
			selectedProject,
			selectedTaskName,
			isOpen,
			specFilterNoTasksOrProject,
			title,
			projectRequired,
			projectDoesNotExist,
			projectArchived,
			taskRequired,
			taskDoesNotExist,
			taskDone
		} = this.state;

		const isLastUsed =
			selectedProject && selectedProject.id === _lastUsedProject.id;

		const { clientProjects } = this.state;
		const sortedClients = Object.keys(clientProjects).sort();
		const index = sortedClients.indexOf('FAVORITES');
		const index2 = sortedClients.indexOf('Without client');
		if (index > 0) {
			const temp = sortedClients[0];
			sortedClients[0] = sortedClients[index];
			sortedClients[index] = temp;
			if (index2 > 1) {
				const temp = sortedClients[1];
				sortedClients[1] = sortedClients[index2];
				sortedClients[index2] = temp;
			}
		} else if (index2 > 0) {
			const temp = sortedClients[0];
			sortedClients[0] = sortedClients[index2];
			sortedClients[index2] = temp;
		}

		const className = JSON.parse(this.state.offline)
			? 'project-list-button-offline'
			: projectRequired || taskRequired
				? 'project-list-button-required'
				: 'project-list-button';

		return (
			<div className="projects-list" title={title}>
				<div
					onClick={this.openProjectDropdown}
					tabIndex={'0'}
					onKeyDown={(e) => {
						if (e.key === 'Enter') this.openProjectDropdown(e);
					}}
					className={className}
				>
					<span
						style={{
							color: selectedProject ? selectedProject.color : '#999999'
						}}
						className="project-list-name"
					>
						{selectedProject
							? (selectedProject.getLocale && selectedProject.getLocale()) ||
							selectedProject.name
							: locales.ADD_PROJECT}
						{selectedTaskName && (
							<span
								style={{
									color: selectedProject ? selectedProject.color : '#999999'
								}}
								className={
									isLastUsed || selectedTaskName === '' ? 'disabled' : ''
								}
							>
								{': ' + selectedTaskName}
							</span>
						)}
						<span className="project-list-name-client">
							{selectedProject &&
							selectedProject.client &&
							selectedProject.client.name &&
							selectedProject.client.name !== 'ON-TOP'
								? ' - ' + selectedProject.client.name
								: ''}
						</span>
					</span>
					<span
						className={isOpen ? 'project-list-arrow-up' : 'project-list-arrow'}
					></span>
				</div>
				{projectDoesNotExist && (
					<div className="clokify-error">
						{locales.DEFAULT_PROJECT_NOT_AVAILABLE}
					</div>
				)}
				{projectArchived && (
					<div className="clokify-error">
						{locales.DEFAULT_PROJECT_ARCHIVED}
					</div>
				)}
				{taskDoesNotExist && (
					<div className="clokify-error">
						{locales.CANT_SAVE_WITHOUT_REQUIRED_FIELDS} ({locales.TASK})
					</div>
				)}
				{taskDone && (
					<div className="clokify-error">{locales.DEFAULT_TASK_DONE}!</div>
				)}

				{isOpen && (
					<div className="project-list-open">
						<div
							onClick={this.closeProjectList.bind(this)}
							className="invisible"
						></div>
						<div
							className="project-list-dropdown"
							id="project-dropdown"
							ref={(ref) => (this.projectDropdownRef = ref)}
						>
							<div
								onScroll={this.handleScroll}
								className="project-list-dropdown--content"
							>
								<div className="project-list-input">
									<div className="project-list-input--border">
										<input
											placeholder={
												this.state.isSpecialFilter
													? locales.MONKEY_SEARCH
													: locales.FIND_PROJECTS
											}
											className="project-list-filter"
											onChange={this.filterProjects.bind(this)}
											id="project-filter"
											ref={(ref) => (this.projectFilterRef = ref)}
											value={this.state.filter}
										/>
										<span
											className={
												!!this.state.filter
													? 'project-list-filter__clear'
													: 'disabled'
											}
											onClick={this.clearProjectFilter}
										></span>
									</div>
								</div>
								{/* {
                                this.state.clients.map(client => {
                                    return (
                                        <div key={client}>
                                            <div className="project-list-client">{client}</div>
                                            {
                                                this.state.projectList
                                                    .filter(project =>
                                                        (project.client && project.client.name === client) ||
                                                        (!project.client && client === 'Without client'))
                                                    .map(project => {
                                                        return (
                                                            <ProjectItem
                                                                key={project.id}
                                                                project={project}
                                                                noTasks={this.props.noTasks}
                                                                selectProject={this.selectProject.bind(this)}
                                                                selectTask={this.selectTask.bind(this)}
                                                                workspaceSettings={this.props.workspaceSettings}
                                                                isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
                                                                getProjectTasks={this.getProjectTasks}
                                                                isLastUsedProject={project.id === getDefaultProjectEnums().LAST_USED_PROJECT}
                                                            />
                                                        )
                                                    })
                                            }
                                        </div>
                                    )
                                })
                            } */}
								<div>
									{(clientProjects['ON-TOP']
											? clientProjects['ON-TOP']
											: []
									).map((project, index) => (
										<ProjectItem
											defaultProjectList={true}
											key={project.id + index}
											project={project}
											noTasks={this.props.noTasks}
											selectProject={this.selectProject.bind(this)}
											selectTask={this.selectTask.bind(this)}
											workspaceSettings={this.props.workspaceSettings}
											isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
											getProjectTasks={this.getProjectTasks}
											isLastUsedProject={
												project.id ===
												getDefaultProjectEnums().LAST_USED_PROJECT
											}
											projectFavorites={false}
											disableCreateTask={true}
										/>
									))}
								</div>
								<div>
									{sortedClients
										.filter((client) => client !== 'ON-TOP')
										.map((client) => (
											<div key={client}>
												<div className="project-list-client">
													<i>
														{client === 'withoutClient'
															? locales.WITHOUT_CLIENT
															: client === 'FAVORITES'
																? locales.FAVORITES
																: client}
													</i>
												</div>
												{clientProjects[client].map((project) => (
													<ProjectItem
														defaultProjectList={true}
														key={project.id}
														project={project}
														noTasks={this.props.noTasks}
														selectProject={this.selectProject.bind(this)}
														selectTask={this.selectTask.bind(this)}
														workspaceSettings={this.props.workspaceSettings}
														isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
														getProjectTasks={this.getProjectTasks}
														isLastUsedProject={
															project.id ===
															getDefaultProjectEnums().LAST_USED_PROJECT
														}
														makeProjectFavorite={this.makeProjectFavorite}
														removeProjectAsFavorite={
															this.removeProjectAsFavorite
														}
														projectFavorites={
															this.props.workspaceSettings.projectFavorites
														}
														disableCreateTask={true}
													/>
												))}
											</div>
										))}
								</div>

								<div
									className={
										specFilterNoTasksOrProject.length > 0
											? 'project-list__spec_filter_no_task_or_project'
											: 'disabled'
									}
								>
									<span>{specFilterNoTasksOrProject}</span>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		);
	}
}

const selectedState = (state) => ({
	isCurrentUserDarkTheme: state.isCurrentUserDarkTheme,
});

export default onClickOutside(
	mapStateToProps(selectedState)(DefaultProjectList)
);
