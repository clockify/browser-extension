import React, { Component } from 'react';
import DefaultProjectList from './default-project-list.component';
import { DefaultProject } from '../helpers/storageUserWorkspace';

const _isPomodoro = true;

class DefaultPomodoroBreakProject extends Component {
	constructor(props) {
		super(props);

		this.state = {
			selectedProject: null,
		};
		this.setAsyncStateItems = this.setAsyncStateItems.bind(this);
	}

	async setAsyncStateItems() {
		let { storage, defaultProject } = await DefaultProject.getStorage(
			_isPomodoro
		);
		if (!defaultProject) {
			defaultProject = storage.setInitialDefaultProject();
		}
		this.setState({
			selectedProject: defaultProject ? defaultProject.project : null,
		});
	}

	componentDidMount() {
		this.setAsyncStateItems();
	}

	async setDefaultProject(project) {
		const { storage } = await DefaultProject.getStorage(_isPomodoro);
		storage.setDefaultProject(project);

		this.setState({
			selectedProject: project,
		});

		this.props.changeSaved();
	}

	projectListOpened() {
		this.props.scrollIntoView();
	}

	render() {
		const { selectedProject } = this.state;
		return (
			<div style={{ padding: '0px 20px 50px 20px' }}>
				<div
					id="defaultProjectPomodoro"
					className="default-project__project-list expandContainer"
					style={{
						maxHeight: '360px',
					}}
				>
					<DefaultProjectList
						ref={(instance) => {
							this.projectList = instance;
						}}
						selectedProject={selectedProject}
						selectProject={this.setDefaultProject.bind(this)}
						workspaceSettings={this.props.workspaceSettings}
						projectListOpened={this.projectListOpened.bind(this)}
						isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
						noTask={false}
						isPomodoro={true}
					/>
				</div>
			</div>
		);
	}
}

export default DefaultPomodoroBreakProject;
