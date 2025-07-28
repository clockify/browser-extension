import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { DefaultProject } from '~/helpers/storageUserWorkspace';
import locales from '~/helpers/locales';
import DefaultProjectList from '~/components/default-project-list.component';
import { WorkspaceSettingsDto } from '~/DTOs/WorkspaceSettingsDto';

interface PropsInterface {
	changeSaved: VoidFunction;
	workspaceSettings: WorkspaceSettingsDto;
	isUserOwnerOrAdmin: boolean;
}

// NOTE: I added suffix Component because we already have DefaultProject class.
export const DefaultProjectComponent = (props: PropsInterface) => {
	const [isDefaultProjectEnabled, setIsDefaultProjectEnabled] = useState(false);
	const [selectedProject, setSelectedProject] = useState(null);

	const projectListRef = useRef(null);

	const projectListOpened = (): void => setIsDefaultProjectEnabled(true);

	const setAsyncStateItems = async (): Promise<void> => {
		const { defaultProject } = await DefaultProject.getStorage();

		setIsDefaultProjectEnabled(defaultProject?.enabled);
		setSelectedProject(defaultProject?.project);
	};

	useEffect(() => {
		setAsyncStateItems();
	}, []);

	const toggleDefaultProjectEnabled = async (): Promise<void> => {
		let { storage, defaultProject } = await DefaultProject.getStorage();

		defaultProject
			? storage.toggleEnabledOfDefaultProject()
			: defaultProject = storage.setInitialDefaultProject();

		setIsDefaultProjectEnabled(!isDefaultProjectEnabled);
		setSelectedProject(defaultProject?.project);

		props.changeSaved();
	};

	const setDefaultProject = async (project: any): Promise<void> => {
		const { storage } = await DefaultProject.getStorage();
		storage.setDefaultProject(project);

		setSelectedProject({});
		setSelectedProject(project);

		props.changeSaved();
	};

	return (
		<div>
			<div
				className="default-project"
				onClick={toggleDefaultProjectEnabled}
			>
					<span
						className={`default-project-checkbox${isDefaultProjectEnabled ? ' checked' : ''}`}
					>
						<img
							src="./assets/images/checked.png"
							className={`default-project-checkbox--img${!isDefaultProjectEnabled ? '_hidden' : ''}`}
						/>
					</span>
				<span className="default-project-title">{
					props.workspaceSettings.forceTasks
						? locales.DEFAULT_PROJECT_AND_TASK
						: locales.DEFAULT_PROJECT
				}</span>
			</div>
			<div
				id="defaultProject"
				className="default-project__project-list expandContainer"
				style={{
					margin: '10px 20px',
					maxHeight: isDefaultProjectEnabled ? '360px' : 0,
				}}
			>
				<DefaultProjectList
					ref={(instance: HTMLElement) => projectListRef.current = instance}
					selectedProject={selectedProject}
					isEnabled={isDefaultProjectEnabled}
					selectProject={setDefaultProject}
					workspaceSettings={props.workspaceSettings}
					projectListOpened={projectListOpened}
					isUserOwnerOrAdmin={props.isUserOwnerOrAdmin}
					noTask={false}
					isPomodoro={false}
				/>
			</div>
		</div>
	);
};