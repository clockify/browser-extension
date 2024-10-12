import React, { Component } from 'react';

import { getLocalStorageEnums } from '../enums/local-storage.enum';
import { getKeyCodes } from '../enums/key-codes.enum';
import Switch from 'antd/lib/switch';
import { getBrowser } from '../helpers/browser-helper';
import { HtmlStyleHelper } from '../helpers/html-style-helper';
import { DefaultPomodoroBreakProject } from '~/components/DefaultPomodoroBreakProject.tsx';
import locales from '../helpers/locales';

const htmlStyleHelper = new HtmlStyleHelper();

class Pomodoro extends Component {
	constructor(props) {
		super(props);

		this.state = {
			enabled: false,
			timerInterval: '',
			shortBreak: '',
			longBreak: '',
			breakCounter: 0,
			isSoundNotification: false,
			isAutomaticStartStop: false,
			isLongBreakEnabled: false,
			isDefaultProjectEnabled: false,
			isFocusModeEnabled: false,
			defaultProjectForUserOnWorkspace: ''
		};
	}

	componentDidMount() {
		this.isPomodoroOn();
	}

	async getPomodoroStorage() {
		const userId = await localStorage.getItem('userId');
		const strPomodoro = await localStorage.getItem('pomodoro');
		const pomodoroStorage = strPomodoro ? JSON.parse(strPomodoro) : [];
		return {
			pomodoroForUser: pomodoroStorage.find(
				(pomodoro) => pomodoro.userId === userId
			),
			pomodoroStorage
		};
	}

	store(pomodoroStorage) {
		localStorage.setItem(
			'pomodoro',
			JSON.stringify(pomodoroStorage),
			getLocalStorageEnums().PERMANENT_PREFIX
		);
	}

	async isPomodoroOn() {
		const { pomodoroForUser } = await this.getPomodoroStorage();
		if (!pomodoroForUser) return;

		const {
			enabled,
			timerInterval,
			shortBreak,
			longBreak,
			isLongBreakEnabled,
			breakCounter,
			isSoundNotification,
			isAutomaticStartStop,
			isDefaultProjectEnabled,
			isFocusModeEnabled
		} = pomodoroForUser;

		this.setState(
			{
				enabled,
				timerInterval,
				shortBreak,
				longBreak,
				isLongBreakEnabled,
				breakCounter,
				isSoundNotification,
				isAutomaticStartStop,
				isDefaultProjectEnabled,
				isFocusModeEnabled
			},
			() => {
				const elementsIds = ['longBreak', 'breakCounter'];
				htmlStyleHelper.enableDisableElements(
					pomodoroForUser.isLongBreakEnabled,
					elementsIds
				);
			}
		);
	}

	async togglePomodoro() {
		let { pomodoroForUser, pomodoroStorage } = await this.getPomodoroStorage();
		let isEnabled;

		const elementsIds = ['longBreak', 'breakCounter'];
		const userId = await localStorage.getItem('userId');

		if (!pomodoroForUser) {
			const obj = {
				userId,
				enabled: true,
				timerInterval: 5,
				shortBreak: 5,
				longBreak: 15,
				isLongBreakEnabled: false,
				breakCounter: 3,
				isSoundNotification: false,
				isAutomaticStartStop: false,
				isDefaultProjectEnabled: false,
				isFocusModeEnabled: false
			};

			pomodoroStorage = [obj];

			const {
				enabled,
				timerInterval,
				shortBreak,
				longBreak,
				isLongBreakEnabled,
				breakCounter,
				isSoundNotification,
				isAutomaticStartStop,
				isDefaultProjectEnabled,
				isFocusModeEnabled
			} = obj;

			this.setState(
				{
					enabled,
					timerInterval,
					shortBreak,
					longBreak,
					isLongBreakEnabled,
					breakCounter,
					isSoundNotification,
					isAutomaticStartStop,
					isDefaultProjectEnabled,
					isFocusModeEnabled
				},
				() => {
					htmlStyleHelper.enableDisableElements(false, elementsIds);
				}
			);

			isEnabled = true;
		} else {
			if (this.state.enabled) {
				pomodoroForUser.enabled = false;
				this.setState({
					enabled: false
				});
				isEnabled = false;
			} else {
				pomodoroForUser.enabled = true;
				this.setState({
					enabled: true
				});
				isEnabled = true;
			}
		}
		this.props.changeSaved();
		this.store(pomodoroStorage);

		if (!isEnabled) {
			getBrowser().runtime.sendMessage({
				eventName: 'restartPomodoro'
			});
		}
	}

	async changePomodoroProperty(event) {
		let value = parseInt(event.target.value);
		const { id } = event.target;
		if (id !== 'breakCounter') {
			if (!value || value < 2) {
				this.props.errorMessage('Length must be at least 2 minutes');
				value = '';
			}
		} else {
			if (!value || value < 1) {
				this.props.errorMessage('Must be at least 1');
				value = '';
			}
		}

		const { pomodoroForUser, pomodoroStorage } =
			await this.getPomodoroStorage();
		let hasValueChanged;
		if (pomodoroForUser) {
			hasValueChanged = pomodoroForUser[id] !== value;
			pomodoroForUser[id] = value ? value : pomodoroForUser[id];
			const obj = {
				[id]: pomodoroForUser[id]
			};
			this.setState(obj);
		}
		value !== '' && this.store(pomodoroStorage);
		hasValueChanged && value !== '' && this.props.changeSaved();
	}

	changePomodoroPropertyOnEnter(event) {
		const { enter, minus } = getKeyCodes();
		if (minus.includes(event.keyCode)) {
			if (event.preventDefault) event.preventDefault();
			return false;
		} else if (enter.includes(event.keyCode)) {
			this.changePomodoroProperty(event);
		}
	}

	changePomodoroPropertyState(event) {
		let { id, value } = event.target;
		value = parseInt(value);
		this.setState({
			[id]: value || ''
		});
	}

	async changeIsSoundNotification(event) {
		const { pomodoroForUser, pomodoroStorage } =
			await this.getPomodoroStorage();
		pomodoroForUser.isSoundNotification = event;
		this.store(pomodoroStorage);
		this.props.changeSaved();
		this.setState({
			isSoundNotification: event
		});
	}

	async changeIsAutomaticStartStop(event) {
		const { pomodoroForUser, pomodoroStorage } =
			await this.getPomodoroStorage();
		pomodoroForUser.isAutomaticStartStop = event;
		this.store(pomodoroStorage);
		this.props.changeSaved();
		this.setState({
			isAutomaticStartStop: event
		});
	}

	async changeIsDefaultProjectEnabled(event) {
		const { pomodoroForUser, pomodoroStorage } =
			await this.getPomodoroStorage();
		pomodoroForUser.isDefaultProjectEnabled = event;
		this.store(pomodoroStorage);
		this.props.changeSaved();
		this.setState({
			isDefaultProjectEnabled: event
		});
	}

	async changeIsFocusModeEnabled(event) {
		const { pomodoroForUser, pomodoroStorage } =
			await this.getPomodoroStorage();
		pomodoroForUser.isFocusModeEnabled = event;
		this.store(pomodoroStorage);
		this.props.changeSaved();
		this.setState({
			isFocusModeEnabled: event
		});
	}

	async toggleLongBreakEnabled(event) {
		const { pomodoroForUser, pomodoroStorage } =
			await this.getPomodoroStorage();
		pomodoroForUser.isLongBreakEnabled = event;
		this.store(pomodoroStorage);
		this.props.changeSaved();
		this.setState(
			{
				isLongBreakEnabled: event
			},
			() => {
				const elementsIds = ['longBreak', 'breakCounter'];
				htmlStyleHelper.enableDisableElements(event, elementsIds);
			}
		);
	}

	render() {
		const { forceProjects, forceTasks } = this.props.workspaceSettings;
		const name = `${locales.DEFAULT_BREAK_PROJECT} ${
			forceTasks ? ` ${locales.AND_TASK}` : ''
		}`;
		return (
			<div>
				<div className="pomodoro" onClick={this.togglePomodoro.bind(this)}>
					<div
						className={
							this.state.enabled
								? 'pomodoro__checkbox checked'
								: 'pomodoro__checkbox'
						}
					>
						<img
							src="./assets/images/checked.png"
							className={
								this.state.enabled
									? 'pomodoro__checkbox--img'
									: 'pomodoro__checkbox--img_hidden'
							}
						/>
					</div>
					<span className="pomodoro__title">
						{locales.ENABLE_POMODORO_TIMER}
					</span>
				</div>
				<div
					id="pomodoro"
					className="pomodoro__content expandContainer"
					style={{ maxHeight: this.state.enabled ? '755px' : '0' }}
				>
					<div>
						<div className="pomodoro__box__content">
							<p>{locales.TIMER_INTERVAL}</p>
							<div className="pomodoro__box__content--right_side">
								<input
									id="timerInterval"
									value={this.state.timerInterval}
									onBlur={this.changePomodoroProperty.bind(this)}
									onKeyDown={this.changePomodoroPropertyOnEnter.bind(this)}
									maxLength={6}
									onChange={this.changePomodoroPropertyState.bind(this)}
								/>
								<p>{locales.MINUTES}</p>
							</div>
						</div>
						<div className="pomodoro__box__content">
							<p>{locales.SHORT_BREAK}</p>
							<div className="pomodoro__box__content--right_side">
								<input
									id="shortBreak"
									value={this.state.shortBreak}
									onBlur={this.changePomodoroProperty.bind(this)}
									maxLength={6}
									onKeyDown={this.changePomodoroPropertyOnEnter.bind(this)}
									onChange={this.changePomodoroPropertyState.bind(this)}
								/>
								<p>{locales.MINUTES}</p>
							</div>
						</div>
						<div className="pomodoro__border"></div>
						<div className="pomodoro__box__content">
							<Switch
								className="pomodoro__switch"
								checked={this.state.isLongBreakEnabled}
								onChange={this.toggleLongBreakEnabled.bind(this)}
							/>
							<p>{locales.LONG_BREAK}</p>
							<div className="pomodoro__box__content--right_side">
								<input
									id="longBreak"
									value={this.state.longBreak}
									onBlur={this.changePomodoroProperty.bind(this)}
									maxLength={6}
									onKeyDown={this.changePomodoroPropertyOnEnter.bind(this)}
									onChange={this.changePomodoroPropertyState.bind(this)}
								/>
								<p>{locales.MINUTES}</p>
							</div>
						</div>
						<div className="pomodoro__box__content">
							<p>{locales.LONG_BREAK_STARTS_AFTER}</p>
							<div className="pomodoro__box__content--right_side">
								<input
									id="breakCounter"
									value={this.state.breakCounter}
									onBlur={this.changePomodoroProperty.bind(this)}
									maxLength={6}
									onKeyDown={this.changePomodoroPropertyOnEnter.bind(this)}
									onChange={this.changePomodoroPropertyState.bind(this)}
								/>
								<p>{locales.BREAKS}</p>
							</div>
						</div>
						<div className="pomodoro__border"></div>
						{/* <div className="pomodoro__box__content">
                            <p>Sound notification</p>
                            <Switch className="pomodoro__switch"
                                    checked={this.state.isSoundNotification}
                                    onChange={this.changeIsSoundNotification.bind(this)}/>
                        </div> */}
						<div className="pomodoro__border"></div>
						<div className="pomodoro__box__content">
							<p>{locales.AUTOMATIC_BREAKS}</p>
							<Switch
								className="pomodoro__switch"
								checked={this.state.isAutomaticStartStop}
								onChange={this.changeIsAutomaticStartStop.bind(this)}
							/>
						</div>
						<div className="pomodoro__border"></div>
						<div className="pomodoro__box__content">
							<p>{locales.FOCUS_MODE}</p>
							<Switch
								className="pomodoro__switch"
								checked={this.state.isFocusModeEnabled}
								onChange={this.changeIsFocusModeEnabled.bind(this)}
							/>
						</div>
						<div className="pomodoro__border"></div>
						<div className="pomodoro__box__content">
							<p>{name}</p>
							<Switch
								className="pomodoro__switch"
								checked={this.state.isDefaultProjectEnabled}
								onChange={this.changeIsDefaultProjectEnabled.bind(this)}
							/>
						</div>
						{this.state.isDefaultProjectEnabled && (
							<div style={{ width: '360px' }}>
								<DefaultPomodoroBreakProject
									workspaceSettings={this.props.workspaceSettings}
									changeSaved={this.props.changeSaved}
									scrollIntoView={this.props.scrollIntoView}
								/>
							</div>
						)}
					</div>
				</div>
			</div>
		);
	}
}

export default Pomodoro;
