import * as React from 'react';
import { useEffect, useState } from 'react';
import { DefaultProject } from '../helpers/storageUserWorkspace';
import DefaultProjectList from './default-project-list.component';
import { WorkspaceSettingsDto } from '../DTOs/WorkspaceSettingsDto';
import { ProjectDtoImpl } from '../DTOs/ProjectDtoImpl';


interface PropsInterface {
	changeSaved: VoidFunction;
	workspaceSettings: WorkspaceSettingsDto;
	scrollIntoView: VoidFunction;
	isUserOwnerOrAdmin: boolean;
}

export const DefaultPomodoroBreakProject = (props: PropsInterface) => {
	const [selectedProject, setSelectedProject] = useState<ProjectDtoImpl>(null);

	useEffect(() => {
		setAsyncStateItems();
	}, []);

	const setAsyncStateItems = async () => {
		let { storage, defaultProject } = await DefaultProject.getStorage(true);

		if (!defaultProject) {
			defaultProject = storage.setInitialDefaultProject();
		}

		setSelectedProject(defaultProject?.project);
	};

	const setDefaultProject = async (project: ProjectDtoImpl) => {
		const { storage } = await DefaultProject.getStorage(true);
		storage.setDefaultProject(project);

		setSelectedProject(project);
		props.changeSaved();
	};

	return (
		<div style={{ padding: '0px 20px 50px 20px' }}>
			<div
				id="defaultProjectPomodoro"
				className="default-project__project-list expandContainer"
				style={{
					maxHeight: '360px'
				}}
			>
				<DefaultProjectList
					selectedProject={selectedProject}
					selectProject={setDefaultProject}
					workspaceSettings={props.workspaceSettings}
					projectListOpened={props.scrollIntoView}
					isUserOwnerOrAdmin={props.isUserOwnerOrAdmin}
					noTask={false}
					isPomodoro={true}
				/>
			</div>
		</div>
	);
};