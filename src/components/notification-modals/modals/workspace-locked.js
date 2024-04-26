import React, { useEffect, useState } from 'react';
import useWorkspaceStore from '../../../zustand/stores/workspaceStore';
import locales from '../../../helpers/locales';
import NotificationTitle from '../notification-modal-components/notification-title';
import NotificationModalDivider from '../notification-modal-components/notification-modal-divider';
import NotificationImage from '../notification-modal-components/notification-image';
import NotificationPrimaryText from '../notification-modal-components/notification-primary-text';
import NotificationPrimaryButton from '../notification-modal-components/notification-primary-button';
import NotificationSecondaryButton from '../notification-modal-components/notification-secondary-button';
import { getBrowser } from '../../../helpers/browser-helper';
import { logout } from '../../../helpers/utils';


const WorkspaceLocked = () => {

	const { workspaceLockData,  setWorkspaceLocked, setWorkspaceLockedMessage } = useWorkspaceStore();
	const { workspaceLocked, workspaceLockedMessage } = workspaceLockData;

	const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
	const [userWorkspaces, setUserWorkspaces] = useState(null);
	const [newWorkspaceId, setNewWorkspaceId] = useState(null);
	const [buttonType, setButtonType] = useState(null);

	useEffect(() => {
		getBrowser()
			.runtime.sendMessage({
			eventName: 'getUser',
		})
			.then((response) => {
				const { data } = response;
				const { activeWorkspace } = data;
				setActiveWorkspaceId(activeWorkspace)
			})
			.catch(() => {});
		getBrowser()
			.runtime.sendMessage({
			eventName: 'getWorkspacesOfUser',
		})
			.then((response) => {
				const { data } = response;
				const workspaces = data? Array.from(data) : null;
				setUserWorkspaces(workspaces);
			})
			.catch(() => {});
	}, [])


	useEffect(() => {
		if (!userWorkspaces || !userWorkspaces) return;
		const newWorkspace = userWorkspaces.find((workspace) => workspace.id !== activeWorkspaceId && workspace.accessEnabled === true)
		if (newWorkspace) setNewWorkspaceId(newWorkspace.id);
	}, [activeWorkspaceId, userWorkspaces])

	useEffect(() => {
		setButtonType(newWorkspaceId? 'Switch workspace' : 'Log out');
	}, [newWorkspaceId])

	const switchWorkspace = async () => {
		if (!newWorkspaceId) return;
		getBrowser()
			.runtime.sendMessage({
			eventName: 'setDefaultWorkspace',
			options: {
				workspaceId: newWorkspaceId,
			},
		})
			.then(() => {
				localStorage.setItem('activeWorkspaceId', newWorkspaceId);
				localStorage.removeItem('preProjectList');
				localStorage.removeItem('preTagsList');
				getBrowser().runtime.sendMessage({
					eventName: 'restartPomodoro',
				});
				setWorkspaceLocked(false);
				setWorkspaceLockedMessage(null);
			})
	}

	const handleLogout = () => {
		logout();
	}

	return (
		<>
			{/*{ workspaceLocked && <div className='notification-modal--open'>*/}
			{/*	<div className='notification-modal'>*/}
			{/*		<NotificationTitle title={locales.WORKSPACE_LOCKED} />*/}
			{/*		<NotificationModalDivider />*/}
			{/*		<NotificationImage image={getBrowser().runtime.getURL(*/}
			{/*			'assets/images/notifications/ws-lock.svg'*/}
			{/*		)} />*/}
			{/*		{workspaceLockedMessage && <NotificationPrimaryText text={workspaceLockedMessage} />}*/}
			{/*		<NotificationModalDivider />*/}
			{/*		<div style={{marginLeft: "auto", marginRight: "20px"}}>*/}
			{/*			{buttonType === "Log out" && <NotificationPrimaryButton*/}
			{/*				buttonTitle={locales.LOG_OUT}*/}
			{/*				handleClick={handleLogout}*/}
			{/*			/>}*/}
			{/*			{buttonType === "Switch workspace" && <NotificationSecondaryButton*/}
			{/*				buttonTitle={locales.SWITCH_WORKSPACE}*/}
			{/*				handleClick={switchWorkspace}*/}
			{/*			/>}*/}
			{/*		</div>*/}
			{/*	</div>*/}
			{/*</div>*/}
			{/*}*/}
		</>

	);
}

export default WorkspaceLocked;