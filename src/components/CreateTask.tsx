import React, { useRef, useState } from 'react';
import locales from '../helpers/locales';
import { getBrowser } from '../helpers/browser-helper';
import Toaster from './toaster-component';
import { TimeEntryDto } from '../DTOs/TimeEntryDto';
import { ProjectDtoImpl } from '../DTOs/ProjectDtoImpl';

interface PropsInterface {
	project: ProjectDtoImpl;
	timeEntry: TimeEntryDto;
	checkRequiredFields: VoidFunction;
	refreshProjectList: Function;
	setShouldAddNewTask: VoidFunction;
	closeModal: VoidFunction;
}

export const CreateTask = (props: PropsInterface) => {
	const [taskName, setTaskName] = useState('');
	const toasterRef = useRef(null);

	const addTask = (): void => {
		const { project } = props;

		const pattern = /<[^>]+>/;
		const taskContainsWrongChars = pattern.test(taskName);

		if (taskContainsWrongChars) {
			return toasterRef.current.toast('error', locales.FORBIDDEN_CHARACTERS, 2);
		}

		if (!taskName) {
			toasterRef.current.toaster.toast('error', locales.NAME_IS_REQUIRED, 2);
			return;
		}

		const task = {
			name: taskName,
			projectId: project.id,
		};

		const createTaskSuccess = (response: {
			error: { message: string };
			data: { id: string; projectId: string };
		}) => {
			if (response.error) {
				return toasterRef.current.toast('error', response.error.message, 2);
			}

			props.checkRequiredFields();
			goBackToEdit();
		};

		const createTaskFailure = (error: { response: { data: { message: any } } }) => {
			toasterRef.current.toast(
				'error',
				locales.replaceLabels(error.response.data.message),
				2
			);
		};

		getBrowser()
			.runtime.sendMessage({
				eventName: 'createTask',
				options: { task },
			})
			.then(createTaskSuccess)
			.catch(createTaskFailure);
	};

	const goBackToEdit = () => {
		try {
			props.refreshProjectList().then(() => {
				props.setShouldAddNewTask?.();
				props.closeModal();
			});
		} catch {
			props.closeModal();
		}
	};
	return (
		<div className={'create-task-wrapper'}>
			<Toaster ref={instance => (toasterRef.current = instance)} />
			<div className="create-task">
				<div className="create-task__title-and-close">
					<p className="create-task__title">{locales.CREATE_NEW_TASK}</p>
					<span onClick={goBackToEdit} className="create-task__close"></span>
				</div>
				<div className="create-task__divider"></div>
				<input
					autoFocus={true}
					className="create-task__task-name"
					placeholder={locales.TASK_NAME}
					value={taskName}
					onChange={event => setTaskName(event.target.value)}></input>

				<div className="create-task__actions">
					<span onClick={addTask} className="create-task__add-button">
						{locales.CREATE_NEW_TASK}
					</span>
					<span onClick={goBackToEdit} className="create-task__cancel">
						{locales.CANCEL}
					</span>
				</div>
			</div>
		</div>
	);
};
