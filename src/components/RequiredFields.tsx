import * as React from 'react';
import { useEffect, useState } from 'react';
import Header from './header.component.jsx';


interface PropsInterface {
	goToEdit: VoidFunction;
	field: string;
	mode: string;
}

export const RequiredFields = (props: PropsInterface) => {
	const [inProgress, setInProgress] = useState(null);

	useEffect(() => {
		checkInProgress();
	}, [inProgress]);

	const checkInProgress = async () => {
		const storageInProgress = await localStorage.getItem('inProgress');

		if (storageInProgress !== inProgress) {
			setInProgress(storageInProgress);
		}
	};

	return (
		<div>
			<Header
				showActions={true}
				mode={props.mode}
				disableManual={inProgress}
				disableAutomatic={false}
			/>
			<div className="required-fields">
				<h3>ALERT</h3>
				<span>This entry can't be saved, please add {props.field}.</span>
				<button onClick={props.goToEdit.bind(this)}>EDIT ENTRY</button>
			</div>
		</div>
	);
};