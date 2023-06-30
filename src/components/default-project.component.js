import * as React from 'react';
import DefaultProjectList from './default-project-list.component';

import { DefaultProject } from '../helpers/storageUserWorkspace';
import locales from '../helpers/locales';

class DefaultProjectComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			defaultProjectEnabled: false,
			selectedProject: null,
		};
		this.setAsyncStateItems = this.setAsyncStateItems.bind(this);
		this.setDefaultProject = this.setDefaultProject.bind(this);
		this.projectListOpened = this.projectListOpened.bind(this);
	}

	async setAsyncStateItems() {
		const { defaultProject } = await DefaultProject.getStorage();
		this.setState({
			defaultProjectEnabled: defaultProject ? defaultProject.enabled : false,
			selectedProject: defaultProject ? defaultProject.project : null,
		});
	}

	componentDidMount() {
		this.setAsyncStateItems();
	}

	// async componentDidUpdate(prevProps, prevState) {
	//     if (prevState.defaultProjectEnabled !== this.state.defaultProjectEnabled) {
	//         const { storage, defaultProject } = await DefaultProject.getStorage();
	//         this.setState({
	//             defaultProjectEnabled: defaultProject ? defaultProject.enabled : false,
	//             selectedProject: defaultProject ? defaultProject.project : null
	//         });
	//     }
	// }

	async toggleDefaultProjectEnabled() {
		let { storage, defaultProject } = await DefaultProject.getStorage();
		if (!defaultProject) {
			defaultProject = storage.setInitialDefaultProject();
		} else {
			storage.toggleEnabledOfDefaultProject();
		}
		this.setState(
			{
				defaultProjectEnabled: !this.state.defaultProjectEnabled,
				selectedProject: defaultProject ? defaultProject.project : null,
			},
			() => {
				// this.projectList.closeOpened();
				this.props.changeSaved();
			}
		);
	}

	async setDefaultProject(project) {
		const { storage } = await DefaultProject.getStorage();
		storage.setDefaultProject(project);

		this.setState({
			selectedProject: project,
		});

		this.props.changeSaved();
	}

	projectListOpened() {
		this.setState({
			defaultProjectEnabled: true,
		});
	}

	render() {
		const { defaultProjectEnabled, selectedProject } = this.state;
		const { forceProjects, forceTasks } = this.props.workspaceSettings;
		const name = forceTasks
			? locales.DEFAULT_PROJECT_AND_TASK
			: locales.DEFAULT_PROJECT;

		return (
			<div>
				<div
					className="default-project"
					onClick={this.toggleDefaultProjectEnabled.bind(this)}
				>
					<span
						className={
							defaultProjectEnabled
								? 'default-project-checkbox checked'
								: 'default-project-checkbox'
						}
					>
						<img
							src="./assets/images/checked.png"
							className={
								defaultProjectEnabled
									? 'default-project-checkbox--img'
									: 'default-project-checkbox--img_hidden'
							}
						/>
					</span>
					<span className="default-project-title">{name}</span>
				</div>
				<div
					id="defaultProject"
					className="default-project__project-list expandContainer"
					style={
						this.state.defaultProjectEnabled
							? {
									margin: '10px 20px',
									maxHeight: '360px',
							  }
							: {
									margin: '10px 20px',
									maxHeight: '0',
							  }
					}
				>
					<DefaultProjectList
						ref={(instance) => {
							this.projectList = instance;
						}}
						selectedProject={selectedProject}
						selectProject={this.setDefaultProject}
						workspaceSettings={this.props.workspaceSettings}
						projectListOpened={this.projectListOpened}
						isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
						noTask={false}
						isPomodoro={false}
					/>
				</div>
			</div>
		);
	}
}

export default DefaultProjectComponent;
