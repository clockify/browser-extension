import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import locales from '../helpers/locales';
import { getBrowser } from '~/helpers/browser-helper';
import Toaster from './toaster-component';
import { ClientDto } from '~/DTOs/ClientDto';
import { ClientList } from '~/components/ClientList/ClientList';
import { ColorPicker } from '~/components/ColorPicker/ColorPicker';
import { WorkspaceSettingsDto } from '~/DTOs/WorkspaceSettingsDto';

interface PropsInterface {
	selectProject: Function;
	closeModal: VoidFunction;
	checkRequiredFields: VoidFunction;
	workspaceSettings: WorkspaceSettingsDto;
}

export const CreateProject = (props: PropsInterface) => {
	const [projectName, setProjectName] = useState('');
	const [client, setClient] = useState(null);
	const [selectedColor, setSelectedColor] = useState('');
	const [isPublic, setIsPublic] = useState(false);
	const [forceTasks, setForceTasks] = useState(false);

	const toasterRef = useRef(null);

	useEffect(() => {
		setAsyncStateItems();
	}, []);

	const setAsyncStateItems = async (): Promise<void> => {
		let isProjectPublicByDefault,
			forceTasks = false;

		const wsSettings = await localStorage.getItem('workspaceSettings');

		if (wsSettings) {
			const parsedWsSettings = JSON.parse(wsSettings);

			isProjectPublicByDefault = parsedWsSettings.isProjectPublicByDefault;
			forceTasks = parsedWsSettings.forceTasks;
		}

		if (props.workspaceSettings.features.featureSubscriptionType === 'FREE_2026') {
			isProjectPublicByDefault = true;
		}

		setForceTasks(forceTasks);
		setIsPublic(isProjectPublicByDefault);
	};

	const addProjectSuccess = (response: { error: { message: string }; data: any }) => {
		if (response.error) return toasterRef.current.toast('error', response.error?.message, 2);

		if (!forceTasks) {
			props.selectProject({ ...response.data, client });
		}

		getBrowser()
			.runtime.sendMessage({
				eventName: 'getUserRoles',
			})
			.then((response: { data: { userRoles: any } }) => {
				if (response && response.data && response.data.userRoles) {
					const { userRoles } = response.data;
					localStorage.setItem('userRoles', userRoles);
				} else {
				}
				props.checkRequiredFields();
				props.closeModal();
			})
			.catch(() => props.closeModal());
	};

	const addProjectFailure = (error: { response: { data: { message: string } } }) => {
		toasterRef.current.toast('error', locales.replaceLabels(error.response.data.message), 2);
	};

	const addProject = (): void => {
		const pattern = /<[^>]+>/;
		const projectContainsWrongChars = pattern.test(projectName);

		if (projectContainsWrongChars) {
			return toasterRef.current.toast('error', locales.FORBIDDEN_CHARACTERS, 2);
		}

		if (!projectName || !selectedColor) {
			toasterRef.current.toast('error', locales.NAME_AND_COLOR_ARE_REQUIRED, 2);
			return;
		}

		if (projectName.length < 2 || projectName.length > 250) {
			toasterRef.current.toast('error', locales.PROJECT_NAME_LENGTH_ERROR, 2);
			return;
		}

		const project = {
			billable: props.workspaceSettings.defaultBillableProjects,
			name: projectName,
			clientId: client ? client.id : '',
			color: selectedColor,
			isPublic,
		};

		getBrowser()
			.runtime.sendMessage({
				eventName: 'createProject',
				options: {
					project,
					createdFromPopup: true,
				},
			})
			.then(addProjectSuccess)
			.catch(addProjectFailure);
	};

	const notifyAboutError = (message: string): void => {
		toasterRef.current.toast('error', locales.replaceLabels(message), 2);
	};

	return (
		<div className={'create-project-wrapper'}>
			<Toaster ref={instance => (toasterRef.current = instance)} />
			<div className="create-project">
				<div className="create-project__title-and-close">
					<p className="create-project__title">{locales.CREATE_NEW_PROJECT}</p>
					<span onClick={props.closeModal} className="create-project__close"></span>
				</div>
				<div className="create-project__divider"></div>
				<input
					autoFocus={true}
					className="create-project__project-name"
					placeholder={locales.PROJECT_NAME}
					value={projectName}
					onBlur={() => setProjectName(projectName.trim())}
					onChange={event => setProjectName(event.target.value)}></input>
				<div className="create-project__client-list">
					<ClientList
						selectedClient={(client: ClientDto) => setClient(client)}
						errorMessage={notifyAboutError}
					/>
				</div>
				<div>
					<ColorPicker selectedColor={(color: string) => setSelectedColor(color)} />
				</div>

				<div className="create-project__public">
					{props.workspaceSettings.features.featureSubscriptionType !== 'FREE_2026' && (
						<>
							<span
								className={`create-project__checkbox ${isPublic && 'checked'}`}
								onClick={() => setIsPublic(!isPublic)}>
								<img
									src="./assets/images/checked.png"
									className={`create-project__public-img${!isPublic && '-hidden'}`}
								/>
							</span>
							<label
								onClick={() => setIsPublic(!isPublic)}
								className="create-project__public-title">
								{locales.PUBLIC}
							</label>
						</>
					)}
				</div>
				<div className="create-project__divider"></div>
				<div className="create-project__actions">
					<span onClick={addProject} className="create-project__add-button">
						{locales.CREATE_NEW_PROJECT}
					</span>
					<span onClick={props.closeModal} className="create-project__cancel">
						{locales.CANCEL}
					</span>
				</div>
			</div>
		</div>
	);
};
