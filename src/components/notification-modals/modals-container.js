import React from 'react';
import WorkspaceLocked from './modals/workspace-locked';
import VerifyEmailModal from './modals/verify-email-modal';

const ModalsContainer = () => {

	return (
		<>
			<WorkspaceLocked />
			<VerifyEmailModal />
		</>
	)
}

export default ModalsContainer;