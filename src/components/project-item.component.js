import * as React from 'react';
import locales from '../helpers/locales';
import { getBrowser } from '~/helpers/browser-helper';
import { debounce } from 'lodash';

class ProjectItem extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isTaskOpen: false,
			taskCount: props.project.taskCount,
			tasks: props.project.tasks ? [...props.project.tasks] : [],
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
		this.filterTasks = debounce(this.filterTasks.bind(this), 650);
		this.getFilterTaskCount = this.getFilterTaskCount.bind(this);
		this.getFilterLoadMore = this.getFilterLoadMore.bind(this);
		this.getFilterIsTaskOpen = this.getFilterIsTaskOpen.bind(this);
	}

	componentDidMount() {
		this.filterTasks(true);
	}

	componentDidUpdate(prevProps, prevState, snapshot) {
		if ((this.props.userSettings?.projectPickerSpecialFilter && !this.props.filter.startsWith('@') && prevProps.filter !== this.props.filter) || !this.props.filter.startsWith('@') && prevProps.filter !== this.props.filter) {
			this.filterTasks();
		}

		if (this.props.project.taskCount !== prevProps.project.taskCount) {
			this.filterTasks();
		}
	}

	getFilterTaskCount(filteredTasks, isInitial) {
		let taskCount;
		const decreaseTaskCountCondition = this.props.project?.id === this.props.selectedProject?.id && this.props.selectedProject?.id === this.props.selectedTask?.projectId;

		// Activate task filter === disabled
		if (!this.props.userSettings?.projectPickerSpecialFilter) {
			taskCount = this.props.project.taskCount;

			if (decreaseTaskCountCondition) {
				taskCount--;
			}

			return taskCount;
		}

		// Activate task filter === enabled
		taskCount = this.props.filter === '' || this.props.project.taskCount > 50 ? this.props.project.taskCount : filteredTasks.length;

		if (isInitial && decreaseTaskCountCondition) {
			taskCount--;
		}

		return taskCount;
	}

	getFilterLoadMore(filteredTasks) {
		// Activate task filter === disabled
		if (!this.props.userSettings?.projectPickerSpecialFilter) {
			return this.state.taskCount > filteredTasks.length;
		}

		// Activate task filter === enabled
		return this.state.taskCount > this.state.tasks.length;
	}

	getFilterIsTaskOpen(filteredTasks) {
		return this.props.userSettings?.projectPickerSpecialFilter && !this.props.filter.startsWith('@') && filteredTasks.length && this.props.filter !== '';
	}

	async filterTasks(isInitial = false) {
		const response = await this.props.getProjectTasks(this.props.project.id, this.props.filter, this.state.page);
		let filteredTasks = response.data?.filter(task => {
			if (task.id === this.props.selectedTask?.id) {
				return true;
			}

			return task.id !== this.props.selectedTask?.id;
		}) ?? [];

		if (response.data?.length === 0 && this.props.project.tasks?.length) {
			filteredTasks = this.props.project.tasks.filter(i => i.id !== this.props.selectedTask?.id);
		}

		this.setState({
			tasks: filteredTasks,
			taskCount: this.getFilterTaskCount(filteredTasks, isInitial),
			isTaskOpen: this.getFilterIsTaskOpen(filteredTasks),
		}, () => {
			this.setState({ loadMore: this.getFilterLoadMore(filteredTasks) });
		});
	}

	async getMyTasks() {
		const response = await this.props.getProjectTasks(this.props.project.id, '', ++this.state.page);

		this.setState({
			tasks: [...this.state.tasks, ...response.data], page: ++this.state.page,
		}, () => {
			this.setState({ loadMore: this.state.taskCount > this.state.tasks.length });
		});
	}

	async openTasks(e) {
		if (e) e.preventDefault();

		if (this.state.tasks.length === 0) {
			if (this.props.project.tasks?.length <= 0) return;

			this.setState({
				tasks: [...this.project?.tasks], isTaskOpen: !this.state.isTaskOpen,
			}, () => {
				if (this.props.selectedProject?.id === this.props.selectedTask?.projectId) {
					this.setState({ taskCount: this.state.taskCount - 1 });
				}
			});
			return;
		}

		this.setState({ isTaskOpen: !this.state.isTaskOpen });
	}

	chooseProject() {
		this.props.selectProject(this.props.project);
	}

	chooseTask(event) {
		let task = JSON.parse(event.target.getAttribute('value'));
		this.props.selectTask(task, this.props.project);
	}

	async toggleFavorite() {
		if (this.state.favorite) {
			await this.props.removeProjectAsFavorite(this.props.project.id);
			this.setState({ favorite: false });
			return;
		}

		await this.props.makeProjectFavorite(this.props.project.id);
		this.setState({ favorite: true });
	}

	shouldShowProject() {
		let shouldBeVisible = true;

		if (this.props.project?.id === this.props.selectedProject?.id && !this.state.tasks.length) {
			shouldBeVisible = false;
		}

		if (this.props.project?.id === 'no-project') {
			const isNoTaskAndProject = !this.props.selectedTask?.id && this.props.selectedProject?.name === 'project';
			const isNoProjectSelected = this.props.selectedProject?.id === 'no-project';
			const isFilterApplied = this.props.filter !== '';

			if (isNoTaskAndProject || isNoProjectSelected || isFilterApplied) {
				shouldBeVisible = false;
			}
		}

		return shouldBeVisible;
	}

	render() {
		const { project, noTasks } = this.props;
		const { isTaskOpen, favorite, client, projectFavorites, favHovered } = this.state;

		let locale = project.getLocale && project.getLocale();
		let title = locale || project.name;
		let clientName = '';
		if (projectFavorites && favorite) {
			if (client?.name) {
				clientName = ' - ' + client.name;
				title += '\n Client: ' + client.name;
			} else {
				title += `\n ${locales.WITHOUT_CLIENT}`;
			}
		}
		const forceTasksButNotLastUsedProject = this.props.workspaceSettings.forceTasks && !this.props.isLastUsedProject;

		return (<>
			{this.shouldShowProject() && <div>
				<ul className="project-item" title={title} data-pw={`project-item-${this.props.projectItemIndex}`}>
					<li
						className="project-item-dot"
						style={{ background: project.color }}
					></li>
					<li
						className="project-item-name"
						onClick={forceTasksButNotLastUsedProject ? () => this.openTasks() : () => this.chooseProject()}
						tabIndex={'0'}
						title={title}
						onKeyDown={(e) => {
							if (e.key === 'Enter') forceTasksButNotLastUsedProject ? this.openTasks() : this.chooseProject();
						}}
					>
						{locale || project.name} <i>{clientName}</i>
					</li>

					{!noTasks && this.state.taskCount === 0 && !this.props.disableCreateTask && this.props.project.id !== 'no-project' && (
						<span
							className="project-item-create-task"
							onClick={() => this.props.openCreateTaskModal(project)}
						>
				{locales.CREATE_TASK}
					</span>)}
					{!noTasks && this.state.taskCount > 0 && (<li
						className="project-item-tasks"
						onClick={this.openTasks}
						title={locales.EXPAND}
					>
					<span
						style={{
							display: 'flex', float: 'right', paddingRight: '5px', alignItems: 'center',
						}}
					>
				{locales.TASKS_NUMBER(this.state.taskCount)}
						{isTaskOpen ? (<img
							style={{ height: 'fit-content' }}
							src={getBrowser().runtime.getURL('assets/images/filter-arrow-down.png')}
							className="tasks-arrow-down"
						/>) : (<img
							style={{ height: 'fit-content' }}
							src={getBrowser().runtime.getURL('assets/images/filter-arrow-right.png')}
							className="tasks-arrow-right"
						/>)}
					</span>
					</li>)}
					{projectFavorites && (<li className="project-item-favorite" title={locales.FAVORITE}>
						{project.id !== 'no-project' && (<a
							style={{
								display: 'inline-block',
								background: `url(${getBrowser().runtime.getURL(favorite ? 'assets/images/ui-icons/favorites-active.svg' : favHovered ? 'assets/images/ui-icons/favorites-hover.svg' : 'assets/images/ui-icons/favorites-normal.svg')})`,
							}}
							className={`cl-dropdown-star ${favorite ? 'cl-active' : ''}`}
							onClick={this.toggleFavorite}
							onMouseEnter={() => this.setState({ favHovered: true })}
							onMouseLeave={() => this.setState({ favHovered: false })}
						></a>)}
					</li>)}
				</ul>
				<div
					className={this.state.isTaskOpen && !noTasks ? 'task-list' : 'disabled'}
				>
					{this.state.tasks.filter(task => this.props.selectedTask?.id !== task.id)
						.map((task) => {
							return (<div
								key={task.id}
								value={JSON.stringify(task)}
								onClick={this.chooseTask.bind(this)}
								className={`task-item`}
							>
								<span value={JSON.stringify(task)}>{task.name}</span>
							</div>);
						})}
					{this.state.loadMore && (<div
						key="load-more"
						className="project-list-load task-item"
						style={{ marginTop: '0px' }}
						onClick={this.getMyTasks}
					>
						{locales.LOAD_MORE}
					</div>)}
					{!this.props.disableCreateTask && this.state.taskCount !== 0 && (<div
						className="projects-list__create-task"
						onClick={() => this.props.openCreateTaskModal(project)}
					>
					<span
						className="projects-list__create-task--icon"
						style={{
							content: `url(${getBrowser().runtime.getURL('assets/images/create.png')})`,
						}}
					></span>
						<span className="projects-list__create-task--text">
				{locales.CREATE_NEW_TASK}
					</span>
					</div>)}
				</div>
			</div>}
		</>);
	}
}

export default ProjectItem;
