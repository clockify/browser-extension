import * as React from 'react';
import Header from './header.component';
import ClientListComponent from './client-list.component';
import ColorPicker from './color-picker.component';
import Toaster from './toaster-component';
import EditForm from './edit-form.component';
import EditFormManual from './edit-form-manual.component';
import locales from '../helpers/locales';
import { getBrowser } from '../helpers/browser-helper';

class CreateProjectComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			projectName: props.projectName,
			client: null,
			selectedColor: null,
			billable: false,
			public: false,
		};
		this.setAsyncStateItems = this.setAsyncStateItems.bind(this);
	}

	async setAsyncStateItems() {
		const wsSettings = await localStorage.getItem('workspaceSettings');
		const billable = wsSettings
			? JSON.parse(wsSettings).defaultBillableProjects
			: false;
		const isProjectPublicByDefault = wsSettings
			? JSON.parse(wsSettings).isProjectPublicByDefault
			: false;
		const forceTasks = wsSettings
			? JSON.parse(wsSettings).forceTasks
			: false;
		this.setState({
			forceTasks,
			billable,
			public: isProjectPublicByDefault,
		});
	}

	componentDidMount() {
		this.projectName.focus();
		this.setAsyncStateItems();
	}

	selectClient(client) {
		this.setState({
			client: client,
		});
	}

	selectColor(color) {
		this.setState({
			selectedColor: color,
		});
	}

	toggleBillable() {
		this.setState({
			billable: !this.state.billable,
		});
	}

	togglePublic() {
		this.setState({
			public: !this.state.public,
		});
	}

	addProject() {
		const { projectName, client, selectedColor, billable } = this.state;

		const pattern = /<[^>]+>/;
		const projectContainsWrongChars = pattern.test(projectName);

		if (projectContainsWrongChars) {
			return this.toaster.toast('error', locales.FORBIDDEN_CHARACTERS, 2);
		}

		if (!projectName || !selectedColor) {
			this.toaster.toast('error', locales.NAME_AND_COLOR_ARE_REQUIRED, 2);
			return;
		}

		if (projectName.length < 2 || projectName.length > 250) {
			this.toaster.toast('error', locales.PROJECT_NAME_LENGTH_ERROR, 2);
			return;
		}

		const project = {
			name: projectName,
			clientId: client ? client.id : '',
			color: selectedColor,
			billable,
			isPublic: this.state.public,
		};

		getBrowser()
			.runtime.sendMessage({
				eventName: 'createProject',
				options: {
					project,
				},
			})
			.then(async (response) => {
				if (response.error)
					return this.toaster.toast('error', response.error?.message, 2);

				if (!this.state.forceTasks) {
					this.props.selectProject(response.data);
				}

				getBrowser()
					.runtime.sendMessage({
						eventName: 'getUserRoles',
					})
					.then((response) => {
						if (response && response.data && response.data.userRoles) {
							const { userRoles } = response.data;
							localStorage.setItem('userRoles', userRoles);
						} else {
						}
						this.props.checkRequiredFields();
						this.goBackToEdit();
					})
					.catch((error) => {
						this.goBackToEdit();
					});
			})
			.catch((error) => {
				this.toaster.toast(
					'error',
					locales.replaceLabels(error.response.data.message),
					2
				);
			});
	}

	handleChange(event) {
		this.setState({
			projectName: event.target.value,
		});
	}

	cancel() {
		this.goBackToEdit();
	}

	goBackToEdit(timeEntry) {
		// if (timeEntry.projectId) {
		// 	getBrowser().runtime.sendMessage({
		// 		eventName: 'editProject',
		// 		options: {
		// 			id: timeEntry.id,
		// 			project: timeEntry.projectId,
		// 		},
		// 	});
		// }

		this.props.closeModal();
	}

	notifyAboutError(message) {
		this.toaster.toast('error', locales.replaceLabels(message), 2);
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
				<div className="create-project">
					<div className="create-project__title-and-close">
						<p className="create-project__title">
							{locales.CREATE_NEW_PROJECT}
						</p>
						<span
							onClick={this.cancel.bind(this)}
							className="create-project__close"
						></span>
					</div>
					<div className="create-project__divider"></div>
					<input
						ref={(input) => {
							this.projectName = input;
						}}
						className="create-project__project-name"
						placeholder={locales.PROJECT_NAME}
						value={this.state.projectName}
						onChange={this.handleChange.bind(this)}
					></input>
					<div className="create-project__client-list">
						<ClientListComponent
							ref={(instance) => {
								this.clientList = instance;
							}}
							selectedClient={this.selectClient.bind(this)}
							errorMessage={this.notifyAboutError.bind(this)}
						/>
					</div>
					<div>
						<ColorPicker selectedColor={this.selectColor.bind(this)} />
					</div>
					<div className="create-project__billable">
						<span
							className={
								this.state.billable
									? 'create-project__checkbox checked'
									: 'create-project__checkbox'
							}
							onClick={this.toggleBillable.bind(this)}
						>
							<img
								src="./assets/images/checked.png"
								className={
									this.state.billable
										? 'create-project__billable-img'
										: 'create-project__billable-img-hidden'
								}
							/>
						</span>
						<label
							onClick={this.toggleBillable.bind(this)}
							className="create-project__billable-title"
						>
							{locales.BILLABLE_LABEL}
						</label>
					</div>

					<div className="create-project__public">
						<span
							className={
								this.state.public
									? 'create-project__checkbox checked'
									: 'create-project__checkbox'
							}
							onClick={this.togglePublic.bind(this)}
						>
							<img
								src="./assets/images/checked.png"
								className={
									this.state.public
										? 'create-project__public-img'
										: 'create-project__public-img-hidden'
								}
							/>
						</span>
						<label
							onClick={this.togglePublic.bind(this)}
							className="create-project__public-title"
						>
							{locales.PUBLIC}
						</label>
					</div>
					<div className="create-project__divider"></div>
					<div className="create-project__actions">
						<span
							onClick={this.addProject.bind(this)}
							className="create-project__add-button"
						>
							{locales.CREATE_NEW_PROJECT}
						</span>
						<span
							onClick={this.cancel.bind(this)}
							className="create-project__cancel"
						>
							{locales.CANCEL}
						</span>
					</div>
				</div>
			</div>
		);
	}
}

export default CreateProjectComponent;
