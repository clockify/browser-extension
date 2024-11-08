import * as React from 'react';
import locales from '../helpers/locales';
import { getBrowser } from '../helpers/browser-helper';

const pageSize = 50;

class ProjectItem extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isTaskOpen: false,
			taskCount: props.project.taskCount,
			tasks: [],
			taskList: props.project.tasks ? [...props.project.tasks] : [],
			favorite: props.project.favorite,
			client: props.project.client,
			projectFavorites: props.projectFavorites,
			page: 1,
			loadMore: false,
			favHovered: false,
		};

		this.chooseProject = this.chooseProject.bind(this);
		this.openTasks = this.openTasks.bind(this);

		this.toggleFavorite = this.toggleFavorite.bind(this);

		this.getMyTasks = this.getMyTasks.bind(this);
	}

	componentDidMount() {
		const { page } = this.state;
		this.props
			.getProjectTasks(this.props.project.id, '', page)
			.then((response) => {
				this.setState({
					tasks: [...this.state.tasks, ...response.data],
				}, () => {
					this.setState({
						loadMore: this.state.taskCount > this.state.tasks.length,
					})
					if (this.props.selectedTask?.projectId && this.props.project?.id && this.props.project?.id === this.props.selectedTask?.projectId) {
						this.setState({
							taskCount: this.state.taskCount - 1,
						})
					}
				});
			})
			.catch(() => {});
	}

	getMyTasks() {
		const { page } = this.state;
		this.props
			.getProjectTasks(this.props.project.id, '', (page + 1))
			.then((response) => {
				this.setState({
					tasks: [...this.state.tasks, ...response.data],
					page: page + 1,
				}, () => {
					this.setState({
						loadMore: this.state.taskCount > this.state.tasks.length,
					})
				});
			})
			.catch(() => {});
	}

	async openTasks(e) {
		if(e) e.preventDefault();
		 
		if (this.state.tasks.length === 0) {
			 
			if (this.state.taskList.length > 0) {
				this.setState({
					tasks: [...this.state.taskList],
					isTaskOpen: !this.state.isTaskOpen,
				}, () => {
					if (this.props.selectedProject?.id === this.props.selectedTask?.projectId) {
						this.setState({
							taskCount: this.state.taskCount - 1,
						})
					}
				});
			}
		} else {
			this.setState({
				isTaskOpen: !this.state.isTaskOpen,
			});
		}
	}

	chooseProject() {
		this.props.selectProject(this.props.project);
	}

	chooseTask(event) {
		let task = JSON.parse(event.target.getAttribute('value'));
		this.props.selectTask(task, this.props.project);
	}

	toggleFavorite() {
		const { project } = this.props;
		const { favorite } = this.state;
		if (favorite) {
			this.props.removeProjectAsFavorite(project.id).then(() => {
				this.setState({
					favorite: false,
				});
			});
		} else {
			this.props.makeProjectFavorite(project.id).then((response) => {
				this.setState({
					favorite: true,
				});
			});
		}
	}

	render() {
		const { project, noTasks, selectedProject, projectId, defaultProjectList } = this.props;
		const {
			isTaskOpen,
			favorite,
			client,
			projectFavorites,
			favHovered,
			taskCount
		} = this.state;
		let shouldBeVisible = taskCount === 0 ? projectId !== selectedProject?.id : true;
		if (defaultProjectList) shouldBeVisible = true;
		let name = project.name;
		let locale = project.getLocale && project.getLocale();
		let title = locale || project.name;
		let clientName = '';
		if (projectFavorites && favorite) {
			if (client && client.name) {
				clientName = ' - ' + client.name;
				title += '\n Client: ' + client.name;
			} else {
				title += `\n ${locales.WITHOUT_CLIENT}`;
			}
		}
		const forceTasksButNotLastUsedProject =
			this.props.workspaceSettings.forceTasks && !this.props.isLastUsedProject;

		return (
			<>
				{shouldBeVisible &&
					<div>
					<ul className="project-item" title={title} data-pw={`project-item-${this.props.projectItemIndex}`}>
					<li
					className="project-item-dot"
					style={{ background: project.color }}
					></li>
					<li
					className="project-item-name"
					onClick={
					forceTasksButNotLastUsedProject
					? () => this.openTasks()
					: () => this.chooseProject()
				}
					tabIndex={'0'}
					title={title}
					onKeyDown={(e) => {
					if (e.key === 'Enter')
					forceTasksButNotLastUsedProject
					? this.openTasks()
					: this.chooseProject();
				}}
					>
				{locale || name} <i>{clientName}</i>
					</li>

				{!noTasks && this.state.taskCount === 0 && !this.props.disableCreateTask && (
					<span
					className="project-item-create-task"
					onClick={() => this.props.openCreateTaskModal(project)}
					>
				{locales.CREATE_TASK}
					</span>
					)}
				{!noTasks && this.state.taskCount > 0 && (
					<li
					className="project-item-tasks"
					onClick={this.openTasks}
					title={locales.EXPAND}
					>
					<span
					style={{
					display: 'flex',
					float: 'right',
					paddingRight: '5px',
					alignItems: 'center',
				}}
					>
				{locales.TASKS_NUMBER(this.state.taskCount)}
				{isTaskOpen ? (
					<img
					style={{ height: 'fit-content' }}
					src={getBrowser().runtime.getURL(
					'assets/images/filter-arrow-down.png'
					)}
					className="tasks-arrow-down"
					/>
					) : (
					<img
					style={{ height: 'fit-content' }}
					src={getBrowser().runtime.getURL(
					'assets/images/filter-arrow-right.png'
					)}
					className="tasks-arrow-right"
					/>
					)}
					</span>
					</li>
					)}
				{projectFavorites && (
					<li className="project-item-favorite" title={locales.FAVORITE}>
				{project.id !== 'no-project' && (
					<a
					style={{
					display: 'inline-block',
					background: `url(${getBrowser().runtime.getURL(
					favorite
					? 'assets/images/ui-icons/favorites-active.svg'
					: favHovered
					? 'assets/images/ui-icons/favorites-hover.svg'
					: 'assets/images/ui-icons/favorites-normal.svg'
					)})`,
				}}
					className={`cl-dropdown-star ${favorite ? 'cl-active' : ''}`}
					onClick={this.toggleFavorite}
					onMouseEnter={() => this.setState({ favHovered: true })}
					onMouseLeave={() => this.setState({ favHovered: false })}
					></a>
					)}
					</li>
					)}
					</ul>
					<div
					className={
					this.state.isTaskOpen && !noTasks ? 'task-list' : 'disabled'
				}
					>
				{this.state.tasks.filter(task => this.props.selectedTask?.id !== task.id)
					.map((task) => {
					return (
					<div
					key={task.id}
					value={JSON.stringify(task)}
					onClick={this.chooseTask.bind(this)}
					className={`task-item`}
					>
					<span value={JSON.stringify(task)}>{task.name}</span>
					</div>
					);
				})}
				{this.state.loadMore && (
					<div
					key="load-more"
					className="project-list-load task-item"
					style={{ marginTop: '0px' }}
					onClick={this.getMyTasks}
					>
				{locales.LOAD_MORE}
					</div>
					)}
				{!this.props.disableCreateTask && this.state.taskCount !== 0 && (
					<div
					className="projects-list__create-task"
					onClick={() => this.props.openCreateTaskModal(project)}
					>
					<span
					className="projects-list__create-task--icon"
					style={{
					content: `url(${getBrowser().runtime.getURL(
					'assets/images/create.png'
					)})`,
				}}
					></span>
					<span className="projects-list__create-task--text">
				{locales.CREATE_NEW_TASK}
					</span>
					</div>
					)}
					</div>
					</div>
				}
			</>
		);
	}
}

export default ProjectItem;
