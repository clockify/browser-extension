import React from 'react';
import ProjectItem from './project-item.component';
import { debounce } from 'lodash';
import { getBrowser } from '~/helpers/browser-helper';
import { CreateTask } from './CreateTask.tsx';
import locales from '../helpers/locales';
import { mapStateToProps } from '~/zustand/mapStateToProps';
import { CreateProject } from '~/components/CreateProject.tsx';

const pageSize = 50;

const _noProjectObj = () => ({
	id: 'no-project',
	name: locales.NO_PROJECT,
	client: {
		name: 'NO-PROJECT',
	},
	color: '#666',
	tasks: [],
});

class ProjectList extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isOpen: false,
			selectedProject: {
				name: this.createNameForSelectedProject(),
				color: null,
			},
			selectedTaskName: '',
			projectList: this.initialProjectList,
			page: 1,
			loadMore: false,
			clientProjects: {},
			title: '',
			filter: '',
			isSpecialFilter: null,
			specFilterNoTasksOrProject: '',
			userRoles: [],
			projectManagerFor: [],
			projectFilterValue: '',
			projectsModalOpen: false,
			tasksModalOpen: false,
			isOffline: false,
		};
		this.projectListDropdownRef = React.createRef();
		this.projectFilterRef = React.createRef();
		this.filterProjects = this.filterProjects.bind(this);
		this.openProjectDropdown = this.openProjectDropdown.bind(this);
		// this.mapSelectedTask = this.mapSelectedTask.bind(this);
		this.createProject = this.createProject.bind(this);
		this.clearProjectFilter = this.clearProjectFilter.bind(this);
		this.openCreateTaskModal = this.openCreateTaskModal.bind(this);
		this.forceProjects = this.props.workspaceSettings.forceProjects;
		this.closeProjectList = this.closeProjectList.bind(this);
		this.getProjects = debounce(this.getProjects.bind(this), 500);
		this.handleScroll = this.handleScroll.bind(this);
		this.getProjectsInitial = this.getProjectsInitial.bind(this);
		this.refreshProjectList = this.refreshProjectList.bind(this);
	}

	get initialProjectList() {
		const { selectedProject } = this.props;
		return !this.forceProjects && selectedProject && selectedProject.id !== 'no-project'
			? [_noProjectObj()]
			: [];
	}

	async setAsyncStateItems() {
		const isOffline = await localStorage.getItem('offline');
		let userRoles = (await localStorage.getItem('userRoles')) || [];
		let projectManagerFor = userRoles
			.find(({ role }) => role === 'PROJECT_MANAGER')
			?.entities.map(({ id }) => id);
		if (userRoles.length) {
			userRoles = userRoles.map(({ role }) => role);
		}
		const userSettings = await localStorage.getItem('userSettings');
		const isSpecialFilter = userSettings
			? JSON.parse(userSettings).projectPickerSpecialFilter
			: false;
		const color = await this.getColorForProject();
		await this.getProjectsInitial(this.state.page, pageSize);
		this.setState(state => ({
			isOffline: JSON.parse(isOffline),
			isSpecialFilter,
			selectedProject: {
				name: state.selectedProject.name,
				color,
			},
			userRoles,
			projectManagerFor,
		}));
	}

	componentDidMount() {
		this.setAsyncStateItems();
		if (this.props.timeEntry?.project) {
			this.setState({
				selectedProject: {
					id: this.props.timeEntry.project.id,
					name: this.props.timeEntry.project.name,
					client: {
						name: this.props.timeEntry.project.clientName,
					},
					color: this.props.timeEntry.project.color,
				},
				selectedTaskName: this.props.timeEntry.task?.name ?? '',
			});
		}
	}

	componentDidUpdate() {
		if (
			(this.props.timeEntry?.project &&
				(this.props.timeEntry.project.id !== this.state.selectedProject.id ||
					(this.props.timeEntry.task?.name &&
						this.props.timeEntry.task.name !== this.state.selectedTaskName))) ||
			(!this.props.timeEntry.task?.name && this.state.selectedTaskName)
		) {
			this.setState(
				{
					selectedProject: {
						id: this.props.timeEntry.project.id,
						name: this.props.timeEntry.project.name,
						client: {
							name:
								this.props.timeEntry.project.clientName ||
								this.props.timeEntry.project?.client?.name,
						},
						color: this.props.timeEntry.project.color,
					},
					selectedTaskName: this.props.timeEntry.task?.name ?? '',
					selectedTask: this.props.timeEntry.task ? this.props.timeEntry.task : {},
				},
				() => {
					this.setState({
						title: this.createTitle(),
					});
				}
			);
		}
	}

	handleClickOutside() {
		if (this.state.isOpen) {
			this.closeProjectList();
		}
	}

	isOpened() {
		return this.state.isOpen;
	}

	closeOpened() {
		this.setState({
			isOpen: false,
		});
	}

	async getProjects(page, pageSize) {
		if (!JSON.parse(await localStorage.getItem('offline'))) {
			const alreadyIds = page === 1 ? [] : this.state.projectList.map(p => p.id);
			getBrowser()
				.runtime.sendMessage({
					eventName: 'getProjects',
					options: {
						filter: this.state.filter,
						page,
						pageSize,
						forceTasks: false,
						alreadyIds,
					},
				})
				.then(response => {
					const projects = response.data;
					const projectList =
						page === 1 ? projects : this.state.projectList.concat(projects);
					let projectListToPutInState;
					if (this.state.filter.length > 0) {
						projectListToPutInState = projectList.filter(
							project => project.id !== 'no-project'
						);
					} else if (projectList.length > 0) {
						projectListToPutInState = projectList;
					}
					if (
						!this.forceProjects &&
						!projectListToPutInState.find(project => project.id === 'no-project')
					) {
						projectListToPutInState = [_noProjectObj(), ...projectListToPutInState];
					}
					this.setState(
						{
							projectList: projectListToPutInState,
							page: this.state.page + 1,
						},
						() => {
							this.setState({
								clientProjects: this.getClients(this.state.projectList),
								loadMore: response.data.length >= pageSize,
								specFilterNoTasksOrProject: this.createMessageForNoTaskOrProject(
									projects,
									this.state.isSpecialFilter,
									this.state.filter
								),
							});
						}
					);
				})
				.catch(() => {});
		}
	}

	async getProjectsInitial(page, pageSize) {
		if (!JSON.parse(await localStorage.getItem('offline'))) {
			const alreadyIds = page === 1 ? [] : this.state.projectList.map(p => p.id);
			getBrowser()
				.runtime.sendMessage({
					eventName: 'getProjects',
					options: {
						filter: this.state.filter,
						page,
						pageSize,
						forceTasks: false,
						alreadyIds,
					},
				})
				.then(response => {
					const projects = response.data;
					const projectList = projects;
					let projectListToPutInState;
					if (this.state.filter.length > 0) {
						projectListToPutInState = projectList.filter(
							project => project.id !== 'no-project'
						);
					} else if (projectList.length > 0) {
						projectListToPutInState = projectList;
					}
					if (
						!this.forceProjects &&
						!projectListToPutInState.find(project => project.id === 'no-project')
					) {
						projectListToPutInState = [_noProjectObj(), ...projectListToPutInState];
					}
					this.setState(
						{
							projectList: projectListToPutInState,
							page: this.state.page + 1,
						},
						() => {
							this.setState({
								clientProjects: this.getClients(this.state.projectList),
								loadMore: response.data.length >= pageSize ? true : false,
								specFilterNoTasksOrProject: this.createMessageForNoTaskOrProject(
									projects,
									this.state.isSpecialFilter,
									this.state.filter
								),
							});
						}
					);
				})
				.catch(() => {});
		}
	}

	createMessageForNoTaskOrProject(projects, isSpecialFilter, filter) {
		if (!isSpecialFilter || filter.length === 0 || projects.length > 0) return '';

		const noMatcingTasks = locales.NO_MATCHING('tasks');
		const noMatcingTProjects = locales.NO_MATCHING('projects');

		if (!filter.includes('@')) {
			return `${noMatcingTasks}. ${locales.MONKEY_SEARCH}`;
		} else {
			return noMatcingTProjects;
		}
	}

	getProjectTasks(projectId, filter, page) {
		return getBrowser().runtime.sendMessage({
			eventName: 'getProjectTasks',
			options: {
				projectId,
				filter,
				page,
			},
		});
	}

	makeProjectFavorite(projectId) {
		return getBrowser().runtime.sendMessage({
			eventName: 'makeProjectFavorite',
			options: {
				projectId,
			},
		});
	}

	removeProjectAsFavorite(projectId) {
		return getBrowser().runtime.sendMessage({
			eventName: 'removeProjectAsFavorite',
			options: {
				projectId,
			},
		});
	}

	groupByClientName(objectArray) {
		return objectArray.reduce((acc, p) => {
			const key = p.client && !!p.client.name ? p.client.name : 'WITHOUT-CLIENT';
			if (!acc[key]) {
				acc[key] = [];
			}
			// Add object to list for given key's value
			acc[key].push(p);
			return acc;
		}, {});
	}

	getClients(projects) {
		if (!projects) return [];
		const { projectFavorites } = this.props.workspaceSettings;
		if (projectFavorites) {
			const clientProjects = this.groupByClientName(projects.filter(p => !p.favorite));
			const favorites = projects.filter(p => p.favorite);
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
		let projectList;
		if (project.id && !this.forceProjects) {
			if (this.state.projectList.find(project => project.id === 'no-project')) {
				projectList = [_noProjectObj(), ...this.state.projectList];
			} else {
				projectList = this.state.projectList;
			}
		} else {
			projectList = this.state.projectList.filter(project => project.id !== 'no-project');
		}

		this.setState({
			// selectedProject: project,
			// selectedTaskName: '',
			isOpen: false,
			projectList: projectList,
		});
	}

	selectTask(task, project) {
		this.props.selectTask(task, project);

		this.setState({
			// selectedProject: project,
			// selectedTaskName: task.name,
			isOpen: false,
		});
	}

	async openProjectDropdown(e) {
		e.stopPropagation();

		if (!JSON.parse(await localStorage.getItem('offline'))) {
			this.setState(
				state => ({
					isOpen: !state.isOpen,
					filter: '',
					page: 1,
				}),
				() => {
					this.projectFilterRef.current?.focus();
					this.getProjects(this.state.page, pageSize);
				}
			);
		}
	}

	closeProjectList() {
		this.projectListDropdownRef.current?.scroll(0, 0);
		this.setState(
			{
				isOpen: false,
				filter: '',
				page: 1,
			},
			() => {}
		);
	}

	filterProjects(e) {
		this.setState(
			{
				projectList: this.initialProjectList,
				filter: e.target.value,
				page: 1,
			},
			() => {
				this.getProjects(this.state.page, pageSize);
			}
		);
	}

	loadMoreProjects() {
		this.getProjects(this.state.page, pageSize);
	}

	createTitle() {
		let title = locales.ADD_PROJECT;
		if (
			this.state.selectedProject &&
			this.state.selectedProject.id &&
			this.state.selectedProject.id !== 'no-project'
		) {
			title = `${locales.PROJECT}: ` + this.state.selectedProject.name;

			if (this.state.selectedTaskName) {
				title = title + `\n${locales.TASK}: ` + this.state.selectedTaskName;
			}

			if (this.state.selectedProject.client && this.state.selectedProject.client.name) {
				title = title + `\n${locales.CLIENT}: ` + this.state.selectedProject.client.name;
			}
		}

		return title;
	}

	createNameForSelectedProject() {
		let name = locales.ADD_PROJECT;
		if (this.props.projectRequired) {
			if (this.props.taskRequired) {
				name = `${locales.ADD_TASK}`;
			}
			name += ` ${locales.REQUIRED_LABEL}`;
		}
		return name;
	}

	clearProjectFilter() {
		this.setState(
			{
				projectList: this.initialProjectList,
				filter: '',
				page: 1,
			},
			() => {
				this.getProjects(this.state.page, pageSize);
			}
		);
	}

	async refreshProjectList() {
		await this.getProjectsInitial(1, pageSize);
	}

	async getColorForProject() {
		if (this.props.isCurrentUserDarkTheme()) {
			return '#c6d2d9';
		} else {
			return '#666';
		}
	}

	createProject() {
		this.setState({
			projectsModalOpen: true,
		});
	}

	openCreateTaskModal(project) {
		this.setState({
			modalProject: project,
			tasksModalOpen: true,
		});
	}

	handleScroll(event) {
		const bottom =
			event.target.scrollHeight - event.target.scrollTop === event.target.clientHeight;
		if (bottom && this.state.loadMore) {
			this.loadMoreProjects();
		}
	}

	render() {
		//tu logika
		//role su u storage
		//u ws settings pravila workspaceSettings.entityCreationPermissions
		//whoCanCreateProjectsAndClients
		//whoCanCreateTags
		//whoCanCreateTasks
		// "EVERYONE", "ADMINS", "ADMINS_AND_PROJECT_MANAGERS"

		const { userRoles, clientProjects, projectManagerFor } = this.state;
		const { whoCanCreateProjectsAndClients, whoCanCreateTasks } = this.props.workspaceSettings
			?.entityCreationPermissions || {
			whoCanCreateProjectsAndClients: 'ADMINS',
			whoCanCreateTasks: 'ADMINS',
		};

		const isEnabledCreateProject =
			!this.props.integrationMode &&
			(whoCanCreateProjectsAndClients === 'EVERYONE' ||
				userRoles.includes('WORKSPACE_ADMIN') ||
				(whoCanCreateProjectsAndClients === 'ADMINS_AND_PROJECT_MANAGERS' &&
					userRoles.includes('PROJECT_MANAGER')));

		const isEnabledCreateTask =
			!this.props.integrationMode &&
			(whoCanCreateTasks === 'EVERYONE' || userRoles.includes('WORKSPACE_ADMIN'));
		const isEnabledCreateTaskForPM =
			!this.props.integrationMode &&
			whoCanCreateTasks === 'ADMINS_AND_PROJECT_MANAGERS' &&
			userRoles.includes('PROJECT_MANAGER');

		// const isEnabledCreateProject = !this.props.workspaceSettings.onlyAdminsCreateProject || this.props.isUserOwnerOrAdmin ? true : false;
		// const { clientProjects } = this.state;
		const sortedClients = Object.keys(clientProjects).sort();
		return this.state.projectsModalOpen ? (
			<CreateProject
				selectProject={this.selectProject.bind(this)}
				timeEntry={this.props.timeEntry}
				editForm={this.props.editForm}
				workspaceSettings={this.props.workspaceSettings}
				timeFormat={this.props.timeFormat}
				isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
				userSettings={this.props.userSettings}
				projectName={this.state.filter}
				checkRequiredFields={this.props.checkRequiredFields}
				closeModal={() =>
					this.setState({
						projectsModalOpen: false,
						modalProject: null,
						isOpen: false,
					})
				}
			/>
		) : this.state.tasksModalOpen ? (
			<CreateTask
				refreshProjectList={this.refreshProjectList}
				setShouldAddNewTask={this.props.setShouldAddNewTask}
				timeEntry={this.props.timeEntry}
				editForm={this.props.editForm}
				workspaceSettings={this.props.workspaceSettings}
				timeFormat={this.props.timeFormat}
				isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
				userSettings={this.props.userSettings}
				project={this.state.modalProject}
				checkRequiredFields={this.props.checkRequiredFields}
				closeModal={() => this.setState({ tasksModalOpen: false, isOpen: false })}
			/>
		) : (
			<div className="projects-list" title={this.state.title}>
				<div
					onClick={this.openProjectDropdown}
					tabIndex={'0'}
					onKeyDown={e => {
						if (e.key === 'Enter') this.openProjectDropdown(e, isEnabledCreateProject);
					}}
					className={
						this.state.isOffline
							? 'project-list-button-offline'
							: this.props.projectRequired || this.props.taskRequired
							? 'project-list-button-required'
							: 'project-list-button'
					}>
					<span
						className="project-list-name"
						style={{
							color: this.state.selectedProject?.color || '',
						}}>
						{this.state.selectedProject?.name || this.createNameForSelectedProject()}
						<span
							style={{ color: this.state.selectedProject?.color || '' }}
							className={this.state.selectedTaskName === '' ? 'disabled' : ''}>
							{': ' + this.state.selectedTaskName}
						</span>
						<span className="project-list-name-client">
							{this.state.selectedProject &&
							this.state.selectedProject.client &&
							this.state.selectedProject.client.name &&
							this.state.selectedProject.client.name !== 'NO-PROJECT'
								? ' - ' + this.state.selectedProject.client.name
								: ''}
						</span>
					</span>
					<span
						className={
							this.state.isOpen ? 'project-list-arrow-up' : 'project-list-arrow'
						}
						style={{
							content: `url(${getBrowser().runtime.getURL(
								'assets/images/' +
									(this.state.isOpen
										? 'arrow-light-mode-up.png'
										: 'arrow-light-mode.png')
							)})`,
						}}></span>
				</div>
				{this.props.taskRequired && (
					<div
						className="clokify-error"
						style={{
							color: this.props.isCurrentUserDarkTheme() ? 'white' : 'black',
						}}>
						{locales.CANT_SAVE_WITHOUT_REQUIRED_FIELDS} ({locales.TASK})
					</div>
				)}
				{this.state.isOpen && (
					<div className="project-list-open">
						<div onClick={this.closeProjectList} className="invisible"></div>
						<div
							className="project-list-dropdown"
							id="project-dropdown"
							ref={this.projectListDropdownRef}>
							<div
								onScroll={this.handleScroll}
								className="project-list-dropdown--content">
								<div className="project-list-input">
									<div className="project-list-input--border">
										<input
											placeholder={
												this.state.isSpecialFilter
													? locales.MONKEY_SEARCH
													: locales.FIND_PROJECTS
											}
											className="project-list-filter"
											onChange={e => this.filterProjects(e)}
											ref={this.projectFilterRef}
											id="project-filter"
											value={this.state.filter}
											autoComplete="off"
										/>
										<span
											className={
												!!this.state.filter
													? 'project-list-filter__clear'
													: 'disabled'
											}
											onClick={this.clearProjectFilter}></span>
									</div>
								</div>
								{clientProjects['NO-PROJECT'] &&
									clientProjects['NO-PROJECT'].length > 0 && (
										<div>
											{clientProjects['NO-PROJECT'].map(project => (
												<ProjectItem
													projectId={project.id}
													selectedProject={this.state.selectedProject}
													selectedTask={this.state.selectedTask}
													key={project.id}
													project={project}
													noTasks={this.props.noTasks}
													selectProject={this.selectProject.bind(this)}
													selectTask={this.selectTask.bind(this)}
													workspaceSettings={this.props.workspaceSettings}
													isUserOwnerOrAdmin={
														this.props.isUserOwnerOrAdmin
													}
													getProjectTasks={this.getProjectTasks}
													projectFavorites={false}
													openCreateTaskModal={this.openCreateTaskModal}
													disableCreateTask={
														!(
															isEnabledCreateTask ||
															(isEnabledCreateTaskForPM &&
																projectManagerFor.includes(
																	project.id
																))
														)
													}
												/>
											))}
										</div>
									)}

								{clientProjects['FAVORITES'] &&
									clientProjects['FAVORITES'].length > 0 && (
										<div>
											<div className="project-list-client">
												<i>{locales.FAVORITES.toUpperCase()}</i>
											</div>
											{clientProjects['FAVORITES'].map((project, index) => (
												<div key={project.id}>
													<ProjectItem
														projectId={project.id}
														selectedProject={this.state.selectedProject}
														selectedTask={this.state.selectedTask}
														projectItemIndex={index}
														key={project.id}
														project={project}
														noTasks={this.props.noTasks}
														selectProject={this.selectProject.bind(
															this
														)}
														selectTask={this.selectTask.bind(this)}
														workspaceSettings={
															this.props.workspaceSettings
														}
														isUserOwnerOrAdmin={
															this.props.isUserOwnerOrAdmin
														}
														getProjectTasks={this.getProjectTasks}
														makeProjectFavorite={
															this.makeProjectFavorite
														}
														removeProjectAsFavorite={
															this.removeProjectAsFavorite
														}
														projectFavorites={
															this.props.workspaceSettings
																.projectFavorites
														}
														openCreateTaskModal={
															this.openCreateTaskModal
														}
														disableCreateTask={
															!(
																isEnabledCreateTask ||
																(isEnabledCreateTaskForPM &&
																	projectManagerFor.includes(
																		project.id
																	))
															)
														}
													/>
												</div>
											))}
										</div>
									)}

								{clientProjects['WITHOUT-CLIENT'] &&
									clientProjects['WITHOUT-CLIENT'].length > 0 && (
										<div>
											<div className="project-list-client">
												<i>{locales.WITHOUT_CLIENT}</i>
											</div>
											{clientProjects['WITHOUT-CLIENT'].map(
												(project, index) => (
													<div key={project.id}>
														<ProjectItem
															projectId={project.id}
															selectedProject={
																this.state.selectedProject
															}
															selectedTask={this.state.selectedTask}
															projectItemIndex={index}
															key={project.id}
															project={project}
															noTasks={this.props.noTasks}
															selectProject={this.selectProject.bind(
																this
															)}
															selectTask={this.selectTask.bind(this)}
															workspaceSettings={
																this.props.workspaceSettings
															}
															isUserOwnerOrAdmin={
																this.props.isUserOwnerOrAdmin
															}
															getProjectTasks={this.getProjectTasks}
															makeProjectFavorite={
																this.makeProjectFavorite
															}
															removeProjectAsFavorite={
																this.removeProjectAsFavorite
															}
															projectFavorites={
																this.props.workspaceSettings
																	.projectFavorites
															}
															openCreateTaskModal={
																this.openCreateTaskModal
															}
															disableCreateTask={
																!(
																	isEnabledCreateTask ||
																	(isEnabledCreateTaskForPM &&
																		projectManagerFor.includes(
																			project.id
																		))
																)
															}
														/>
													</div>
												)
											)}
										</div>
									)}
								<div>
									{sortedClients
										.filter(
											client =>
												![
													'FAVORITES',
													'NO-PROJECT',
													'WITHOUT-CLIENT',
												].includes(client)
										)
										.map(client => (
											<div key={client}>
												<div className="project-list-client">
													<i>{client}</i>
												</div>
												{clientProjects[client].map(project => (
													<ProjectItem
														projectId={project.id}
														selectedProject={this.state.selectedProject}
														selectedTask={this.state.selectedTask}
														key={project.id}
														project={project}
														noTasks={this.props.noTasks}
														selectProject={this.selectProject.bind(
															this
														)}
														selectTask={this.selectTask.bind(this)}
														workspaceSettings={
															this.props.workspaceSettings
														}
														isUserOwnerOrAdmin={
															this.props.isUserOwnerOrAdmin
														}
														getProjectTasks={this.getProjectTasks}
														makeProjectFavorite={
															this.makeProjectFavorite
														}
														removeProjectAsFavorite={
															this.removeProjectAsFavorite
														}
														projectFavorites={
															this.props.workspaceSettings
																.projectFavorites
														}
														openCreateTaskModal={
															this.openCreateTaskModal
														}
														disableCreateTask={
															!(
																isEnabledCreateTask ||
																(isEnabledCreateTaskForPM &&
																	projectManagerFor.includes(
																		project.id
																	))
															)
														}
													/>
												))}
											</div>
										))}
								</div>
								<div
									className={
										this.state.specFilterNoTasksOrProject.length > 0
											? 'project-list__spec_filter_no_task_or_project'
											: 'disabled'
									}>
									<span>{this.state.specFilterNoTasksOrProject}</span>
								</div>
								{isEnabledCreateProject && (
									<>
										<div className="projects-list__bottom-padding"></div>
										<div
											className="projects-list__create-project"
											onClick={this.createProject}>
											<span
												className="projects-list__create-project--icon"
												style={{
													content: `url(${getBrowser().runtime.getURL(
														'assets/images/create.png'
													)})`,
												}}></span>
											<span className="projects-list__create-project--text">
												{locales.CREATE_NEW_PROJECT}
											</span>
										</div>
									</>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		);
	}
}

const selectedState = state => ({
	isCurrentUserDarkTheme: state.isCurrentUserDarkTheme,
});

export default mapStateToProps(selectedState)(ProjectList);
