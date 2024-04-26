import React from 'react';
import Header from './header.component';
import Toaster from './toaster-component';
import EditForm from './edit-form.component';
import EditFormManual from './edit-form-manual.component';
import locales from '../helpers/locales';
import { getBrowser } from '../helpers/browser-helper';

class CreateTask extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			taskName: '',
		};
		this.addTask = this.addTask.bind(this);
		this.cancel = this.cancel.bind(this);
	}

	componentDidMount() {
		this.taskName.focus();
	}

	addTask() {
		const { taskName } = this.state;
		const { project } = this.props;

		const pattern = /<[^>]+>/;
		const taskContainsWrongChars = pattern.test(taskName);

		if (taskContainsWrongChars) {
			return this.toaster.toast('error', locales.FORBIDDEN_CHARACTERS, 2);
		}

		if (!taskName) {
			this.toaster.toast('error', locales.NAME_IS_REQUIRED, 2);
			return;
		}

		const task = {
			name: taskName,
			projectId: project.id,
		};


		getBrowser()
			.runtime.sendMessage({
				eventName: 'createTask',
				options: {
					task,
				},
			})
			.then((response) => {
				if (response.error)
					return this.toaster.toast('error', response.error.message, 2);
				const timeEntry = Object.assign(this.props.timeEntry, {
					taskId: response.data.id,
					projectId: response.data.projectId,
					task: Object.assign(task, { id: response.data.id }),
					project,
					billable: project.billable,
					clientId: project.clientId,
					color: project.color,
					isPublic: project.isPublic,
				});
				this.props.checkRequiredFields();
				this.goBackToEdit(timeEntry);
			})
			.catch((error) => {
				console.log(error)
				this.toaster.toast(
					'error',
					locales.replaceLabels(error.response.data.message),
					2
				);
			});
	}

	handleChange(event) {
		this.setState({
			taskName: event.target.value,
		});
	}

	cancel() {
		this.goBackToEdit(this.props.timeEntry);
	}

	goBackToEdit() {
		try {
			this.props.refreshProjectList().then(() => {
				if (this.props.setShouldAddNewTask) {
					this.props.setShouldAddNewTask();
				}
				this.props.closeModal();
			});
		} catch {
			this.props.closeModal();
		}
	}

	render() {
		return (
			<div
				style={{
					backgroundColor: 'rgba(0, 0, 0, 0.8)',
					position: 'fixed',
					width: '100vw',
					height: '100vh',
					left: '0',
					top: '0',
					zIndex: '999',
				}}
			>
				<Toaster
					ref={(instance) => {
						this.toaster = instance;
					}}
				/>
				<div className="create-task">
					<div className="create-task__title-and-close">
						<p className="create-task__title">{locales.CREATE_NEW_TASK}</p>
						<span
							onClick={this.cancel.bind(this)}
							className="create-task__close"
						></span>
					</div>
					<div className="create-task__divider"></div>
					<input
						ref={(input) => {
							this.taskName = input;
						}}
						className="create-task__task-name"
						placeholder={locales.TASK_NAME}
						value={this.state.taskName}
						onChange={this.handleChange.bind(this)}
					></input>

					<div className="create-task__actions">
						<span onClick={this.addTask} className="create-task__add-button">
							{locales.CREATE_NEW_TASK}
						</span>
						<span onClick={this.cancel} className="create-task__cancel">
							{locales.CANCEL}
						</span>
					</div>
				</div>
			</div>
		);
	}
}

export default CreateTask;
