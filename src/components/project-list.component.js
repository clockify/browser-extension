import React from 'react';
import ProjectItem from './project-item.component';
import { debounce } from 'lodash';

import { getBrowser } from '../helpers/browser-helper';
import CreateProjectComponent from './create-project.component';
import CreateTask from './create-task.component';
import locales from '../helpers/locales';
import onClickOutside from 'react-onclickoutside';

const pageSize = 50;

const _noProjectObj = () => ({
	id: 'no-project',
	name: locales.NO_PROJECT,
	client: {
		name: 'NO-PROJECT',
	},
	color: '#999999',
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
			loadMore: true,
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
	}

	get initialProjectList() {
		const { selectedProject } = this.props;
		return !this.forceProjects &&
			selectedProject &&
			selectedProject.id !== 'no-project'
			? [_noProjectObj()]
			: [];
	}

	async setAsyncStateItems() {
		let userRoles = (await localStorage.getItem('userRoles')) || [];
		let projectManagerFor = userRoles
			.find(({ role }) => role === 'PROJECT_MANAGER')
			?.entities.map(({ id }) => id);
		if (userRoles.length) {
			userRoles = userRoles.map(({ role }) => role);
		}
		const workspaceSettings = await localStorage.getItem('workspaceSettings');
		const isSpecialFilter = workspaceSettings
			? JSON.parse(workspaceSettings).projectPickerSpecialFilter
			: false;
		const color = await this.getColorForProject();
		const preProjectList = (await localStorage.getItem('preProjectList')) || {};
		let { projectList = [_noProjectObj()], clientProjects = {} } =
			preProjectList;
		if (!preProjectList?.clientProjects) {
			clientProjects = this.getClients(projectList);
		}
		this.setState((state) => ({
			isSpecialFilter,
			selectedProject: {
				name: state.selectedProject.name,
				color,
			},
			projectList,
			clientProjects,
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
			this.props.timeEntry?.project &&
			(this.props.timeEntry.project.id !== this.state.selectedProject.id ||
				(this.props.timeEntry.task?.name &&
					this.props.timeEntry.task.name !== this.state.selectedTaskName))
		) {
			this.setState(
				{
					selectedProject: {
						id: this.props.timeEntry.project.id,
						name: this.props.timeEntry.project.name,
						client: {
							name: this.props.timeEntry.project.clientName,
						},
						color: this.props.timeEntry.project.color,
					},
					selectedTaskName: this.props.timeEntry.task?.name ?? '',
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
			const alreadyIds =
				page === 1 ? [] : this.state.projectList.map((p) => p.id);
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
				.then((response) => {
					const projects = response.data;
					const projectList =
						page === 1 ? projects : this.state.projectList.concat(projects);
					this.setState(
						{
							projectList:
								this.state.filter.length > 0
									? projectList.filter((project) => project.id !== 'no-project')
									: projectList.length > 0
									? projectList
									: this.forceProjects
									? []
									: [_noProjectObj()],
							page: this.state.page + 1,
						},
						() => {
							this.setState(
								{
									clientProjects: this.getClients(this.state.projectList),
									loadMore: response.data.length >= pageSize ? true : false,
									specFilterNoTasksOrProject:
										this.createMessageForNoTaskOrProject(
											projects,
											this.state.isSpecialFilter,
											this.state.filter
										),
								},
								() => {
									if (!this.state.filter && page === 1) {
										localStorage.setItem('preProjectList', {
											projectList: this.state.projectList,
											clientProjects: this.state.clientProjects,
										});
									}
								}
							);
						}
					);
				})
				.catch(() => {});
		}
	}

	createMessageForNoTaskOrProject(projects, isSpecialFilter, filter) {
		if (!isSpecialFilter || filter.length === 0 || projects.length > 0)
			return '';

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
			const key =
				p.client && !!p.client.name ? p.client.name : 'WITHOUT-CLIENT';
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
			const clientProjects = this.groupByClientName(projects);
			return clientProjects;
		}
	}

	selectProject(project) {
		this.props.selectProject(project);
		let projectList;
		if (project.id && !this.forceProjects) {
			if (
				this.state.projectList.find((project) => project.id === 'no-project')
			) {
				projectList = [_noProjectObj(), ...this.state.projectList];
			} else {
				projectList = this.state.projectList;
			}
		} else {
			projectList = this.state.projectList.filter(
				(project) => project.id !== 'no-project'
			);
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
				(state) => ({
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
				filter: e.target.value.toLowerCase(),
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

			if (
				this.state.selectedProject.client &&
				this.state.selectedProject.client.name
			) {
				title =
					title +
					`\n${locales.CLIENT}: ` +
					this.state.selectedProject.client.name;
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

	async getColorForProject() {
		const userId = await localStorage.getItem('userId');
		const darkMode = await localStorage.getItem('darkMode');
		const darkModeFromStorage = darkMode ? JSON.parse(darkMode) : [];

		if (
			darkModeFromStorage.length > 0 &&
			darkModeFromStorage.filter(
				(darkMode) => darkMode.userId === userId && darkMode.enabled
			).length > 0
		) {
			return '#90A4AE';
		} else {
			return '#999999';
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

	render() {
		//tu logika
		//role su u storage
		//u ws settings pravila workspaceSettings.entityCreationPermissions
		//whoCanCreateProjectsAndClients
		//whoCanCreateTags
		//whoCanCreateTasks
		// "EVERYONE", "ADMINS", "ADMINS_AND_PROJECT_MANAGERS"

		const { userRoles, clientProjects, projectManagerFor } = this.state;
		const { whoCanCreateProjectsAndClients, whoCanCreateTasks } = this.props
			.workspaceSettings?.entityCreationPermissions || {
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
			(whoCanCreateTasks === 'EVERYONE' ||
				userRoles.includes('WORKSPACE_ADMIN'));
		const isEnabledCreateTaskForPM =
			!this.props.integrationMode &&
			whoCanCreateTasks === 'ADMINS_AND_PROJECT_MANAGERS' &&
			userRoles.includes('PROJECT_MANAGER');

		// const isEnabledCreateProject = !this.props.workspaceSettings.onlyAdminsCreateProject || this.props.isUserOwnerOrAdmin ? true : false;
		// const { clientProjects } = this.state;
		const sortedClients = Object.keys(clientProjects).sort();
		return this.state.projectsModalOpen ? (
			<CreateProjectComponent
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
				timeEntry={this.props.timeEntry}
				editForm={this.props.editForm}
				workspaceSettings={this.props.workspaceSettings}
				timeFormat={this.props.timeFormat}
				isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
				userSettings={this.props.userSettings}
				project={this.state.modalProject}
				checkRequiredFields={this.props.checkRequiredFields}
				closeModal={() =>
					this.setState({ tasksModalOpen: false, isOpen: false })
				}
			/>
		) : (
			<div className="projects-list" title={this.state.title}>
				<div
					onClick={this.openProjectDropdown}
					tabIndex={'0'}
					onKeyDown={(e) => {
						if (e.key === 'Enter')
							this.openProjectDropdown(e, isEnabledCreateProject);
					}}
					className={
						this.state.isOffline
							? 'project-list-button-offline'
							: this.props.projectRequired || this.props.taskRequired
							? 'project-list-button-required'
							: 'project-list-button'
					}
				>
					<span
						className="project-list-name"
						style={{
							color: this.state.selectedProject
								? this.state.selectedProject.color
								: '#333',
						}}
					>
						{this.state.selectedProject
							? this.state.selectedProject.name
							: locales.ADD_PROJECT}
						<span
							style={{
								color: this.state.selectedProject
									? this.state.selectedProject.color
									: '#333',
							}}
							className={this.state.selectedTaskName === '' ? 'disabled' : ''}
						>
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
						}}
					></span>
				</div>
				{this.props.taskRequired && (
					<div className="clokify-error">
						{locales.CANT_SAVE_WITHOUT_REQUIRED_FIELDS} ({locales.TASK})
					</div>
				)}

				{this.state.isOpen && (
					<div className="project-list-open">
						<div onClick={this.closeProjectList} className="invisible"></div>
						<div
							className="project-list-dropdown"
							id="project-dropdown"
							ref={this.projectListDropdownRef}
						>
							<div className="project-list-dropdown--content">
								<div className="project-list-input">
									<div className="project-list-input--border">
										<input
											placeholder={
												this.state.isSpecialFilter
													? locales.MONKEY_SEARCH
													: locales.FIND_PROJECTS
											}
											className="project-list-filter"
											onChange={(e) => this.filterProjects(e)}
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
											onClick={this.clearProjectFilter}
										></span>
									</div>
								</div>
								{clientProjects['NO-PROJECT'] &&
									clientProjects['NO-PROJECT'].length > 0 && (
										<div>
											{clientProjects['NO-PROJECT'].map((project) => (
												<ProjectItem
													key={project.id}
													project={project}
													noTasks={this.props.noTasks}
													selectProject={this.selectProject.bind(this)}
													selectTask={this.selectTask.bind(this)}
													workspaceSettings={this.props.workspaceSettings}
													isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
													getProjectTasks={this.getProjectTasks}
													projectFavorites={false}
													openCreateTaskModal={this.openCreateTaskModal}
													disableCreateTask={
														!(
															isEnabledCreateTask ||
															(isEnabledCreateTaskForPM &&
																projectManagerFor.includes(project.id))
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
											{clientProjects['FAVORITES'].map((project) => (
												<div key={project.id}>
													<ProjectItem
														key={project.id}
														project={project}
														noTasks={this.props.noTasks}
														selectProject={this.selectProject.bind(this)}
														selectTask={this.selectTask.bind(this)}
														workspaceSettings={this.props.workspaceSettings}
														isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
														getProjectTasks={this.getProjectTasks}
														makeProjectFavorite={this.makeProjectFavorite}
														removeProjectAsFavorite={
															this.removeProjectAsFavorite
														}
														projectFavorites={
															this.props.workspaceSettings.projectFavorites
														}
														openCreateTaskModal={this.openCreateTaskModal}
														disableCreateTask={
															!(
																isEnabledCreateTask ||
																(isEnabledCreateTaskForPM &&
																	projectManagerFor.includes(project.id))
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
											{clientProjects['WITHOUT-CLIENT'].map((project) => (
												<div key={project.id}>
													<ProjectItem
														key={project.id}
														project={project}
														noTasks={this.props.noTasks}
														selectProject={this.selectProject.bind(this)}
														selectTask={this.selectTask.bind(this)}
														workspaceSettings={this.props.workspaceSettings}
														isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
														getProjectTasks={this.getProjectTasks}
														makeProjectFavorite={this.makeProjectFavorite}
														removeProjectAsFavorite={
															this.removeProjectAsFavorite
														}
														projectFavorites={
															this.props.workspaceSettings.projectFavorites
														}
														openCreateTaskModal={this.openCreateTaskModal}
														disableCreateTask={
															!(
																isEnabledCreateTask ||
																(isEnabledCreateTaskForPM &&
																	projectManagerFor.includes(project.id))
															)
														}
													/>
												</div>
											))}
										</div>
									)}
								<div>
									{sortedClients
										.filter(
											(client) =>
												!['FAVORITES', 'NO-PROJECT', 'WITHOUT-CLIENT'].includes(
													client
												)
										)
										.map((client) => (
											<div key={client}>
												<div className="project-list-client">
													<i>{client}</i>
												</div>
												{clientProjects[client].map((project) => (
													<ProjectItem
														key={project.id}
														project={project}
														noTasks={this.props.noTasks}
														selectProject={this.selectProject.bind(this)}
														selectTask={this.selectTask.bind(this)}
														workspaceSettings={this.props.workspaceSettings}
														isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
														getProjectTasks={this.getProjectTasks}
														makeProjectFavorite={this.makeProjectFavorite}
														removeProjectAsFavorite={
															this.removeProjectAsFavorite
														}
														projectFavorites={
															this.props.workspaceSettings.projectFavorites
														}
														openCreateTaskModal={this.openCreateTaskModal}
														disableCreateTask={
															!(
																isEnabledCreateTask ||
																(isEnabledCreateTaskForPM &&
																	projectManagerFor.includes(project.id))
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
									}
								>
									<span>{this.state.specFilterNoTasksOrProject}</span>
								</div>
								{this.state.loadMore && (
									<div
										className="project-list-load"
										onClick={this.loadMoreProjects.bind(this)}
									>
										{locales.LOAD_MORE}
									</div>
								)}
								{isEnabledCreateProject && (
									<>
										<div className="projects-list__bottom-padding"></div>
										<div
											className="projects-list__create-project"
											onClick={this.createProject}
										>
											<span
												className="projects-list__create-project--icon"
												style={{
													content: `url(${getBrowser().runtime.getURL(
														'assets/images/create.png'
													)})`,
												}}
											></span>
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

export default ProjectList;
