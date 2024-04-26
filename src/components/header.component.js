import * as React from 'react';
import Menu from './menu.component';
import Notifications from './notifications.component';
import { getEnv } from '../environment';

import { getLocalStorageEnums } from '../enums/local-storage.enum';
import locales from '../helpers/locales';
import { isLoggedIn } from '../helpers/utils';
import { getBrowser } from '../helpers/browser-helper';

const environment = getEnv();

let _interval;
// const _sreenshotMessage = "Screenshot recording is enabled. This app can't take screenshots.";
// const _sreenshotMessageON = "Screenshot recording is enabled. This app can't take screenshots.";
//"Admin has enabled screenshots recording in COING workspace.";
// const _sreenshotMessageOFF = "Admin has turned off screenshot recording in COING workspace.";

class Header extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isMenuOpen: false,
			showScreenshotNotification: false,
			screenshotMessage: locales.SCREENSHOT_RECORDING,
			showScreenshotLink: false,
			isLoggedIn: false,
			clockifyLink: '',
			isNotificationsDropdownOpen: false,
		};

		this.closeMenus = this.closeMenus.bind(this);
		this.showScreenshotNotifications =
			this.showScreenshotNotifications.bind(this);
		// this.processNotifications = this.processNotifications.bind(this);
		this.handleRefresh = this.handleRefresh.bind(this);
		this.returnClockifyLink = this.returnClockifyLink.bind(this);
		// this.checkScreenshotNotifications = this.checkScreenshotNotifications.bind(this);
		this.selectWorkspace = this.selectWorkspace.bind(this);
	}

	componentDidMount() {
		// this.checkScreenshotNotifications();
		isLoggedIn()
			.then((isLoggedIn) => {
				this.setState({
					isLoggedIn,
				});
			})
			.catch(() => {});
		this.returnClockifyLink().then((link) => {
			this.setState({
				clockifyLink: link,
			});
		});
	}

	componentWillUnmount() {
		if (_interval) clearInterval(_interval);
	}

	// processNotifications() {
	//     const activeWorkspaceId = await localStorage.getItem('activeWorkspaceId', null);
	//     const userId = await localStorage.getItem('userId', null);
	//     if (userId) {
	//         userService.getNotifications(userId)
	//             .then(response => {
	//                 let notifications = response.data;
	//                 notifications.forEach(notification => {
	//                     const { id, type, status, data } = notification;
	//                     const { workspaceId, message, title } = data;
	//                     if (status === 'UNREAD' && activeWorkspaceId === workspaceId && type === 'MONITORING') {
	//                         const wsNames = message.match(/recording in (\w+)/);
	//                         const wsName = wsNames.length > 1 ? wsNames[1] : "COING";
	//                         const on = title === "Screenshots enabled";
	//                         const msg = on
	//                             ? _sreenshotMessageON
	//                             : _sreenshotMessageOFF.replace(/COING/, wsName);
	//                         this.onBackendScreenshotNotification({
	//                             workspaceId,
	//                             userId,
	//                             on,
	//                             message: msg
	//                         })
	//                         userService.markAsRead(userId, id);
	//                     }
	//                 })
	//                 this.showScreenshotNotifications();
	//             })
	//     }
	// }

	openMenu() {
		this.setState({
			isMenuOpen: true,
		});
	}

	openNotificationsDropdown() {
		this.setState({
			isNotificationsDropdownOpen: true,
		});
	}

	closeMenus() {
		this.setState({
			isMenuOpen: false,
			isNotificationsDropdownOpen: false,
		});
	}

	changeToManualMode() {
		this.closeMenus();
		this.props.changeMode('manual');
	}

	changeToTimerMode() {
		this.closeMenus();
		this.props.changeMode('timer');
	}

	selectWorkspace(workspace) {
		this.props.clearEntries();

		const workspaceId = workspace.id;
		const workspaceName = workspace.name;

		this.beforeWorkspaceChange();

		this.setState((state) => ({
			revert: false,
			selectedWorkspaceId: workspaceId,
			workspaceNameSelected: workspaceName,
			previousWorkspace: state.selectedWorkspace,
			selectedWorkspace: workspace,
		}));
		getBrowser()
			.runtime.sendMessage({
				eventName: 'setDefaultWorkspace',
				options: {
					workspaceId,
				},
			})
			.then((response) => {
				const subDomainName = response.headers
					? response.headers['sub-domain-name']
					: null;
				if (subDomainName) {
					this.setState({
						revert: false,
						workspaceChangeConfirmationIsOpen: true,
						subDomainName: subDomainName,
					});
					return;
				}
				localStorage.setItem('activeWorkspaceId', workspaceId);
				localStorage.removeItem('preProjectList');
				localStorage.removeItem('preTagsList');

				getBrowser().storage.local.set({
					activeWorkspaceId: workspaceId,
				});

				this.setState({
					defaultProjectEnabled: false,
				});

				// getBrowser().extension.getBackgroundPage().restartPomodoro();
				getBrowser().runtime.sendMessage({
					eventName: 'restartPomodoro',
				});

				this.props.workspaceChanged();
			})
			.catch((error) => {
				if (error.response?.data.code === 1013) {
					this.setState({
						show2FAPopup: true,
					});
				}
			});
	}

	async returnClockifyLink() {
		const subDomain = await localStorage.getItem('subDomainName', null);
		const homeUrl = subDomain
			? `https://${subDomain}.${environment.mainDomain}`
			: environment.home;

		return `${homeUrl}/tracker`;
	}

	async getScreenshotNotificationInfo() {
		const activeWorkspaceId = await localStorage.getItem(
			'activeWorkspaceId',
			null
		);
		const userId = await localStorage.getItem('userId', null);
		let workspaceSettings = await localStorage.getItem('workspaceSettings');
		workspaceSettings = (await workspaceSettings)
			? JSON.parse(workspaceSettings)
			: null;
		const isScreenshotMessageRed = await localStorage.getItem(
			'isScreenshotMessageRed'
		);
		let list = (await isScreenshotMessageRed)
			? JSON.parse(isScreenshotMessageRed)
			: [];
		return { activeWorkspaceId, userId, workspaceSettings, list };
	}

	async showScreenshotNotifications() {
		const { activeWorkspaceId, userId, workspaceSettings, list } =
			await this.getScreenshotNotificationInfo();
		if (
			activeWorkspaceId == null ||
			userId == null ||
			workspaceSettings == null
		) {
			return;
		}

		let message = locales.SCREENSHOT_RECORDING;
		let filtered = list.filter(
			(item) => item.workspaceId === activeWorkspaceId && item.userId === userId
		);

		const item = filtered.length > 0 ? filtered[0] : null;
		if (item) {
			if (!item.isClosed) {
				if (workspaceSettings.screenshotsEnabled && !item.turnedOn) {
					this.setState({
						showScreenshotNotification: true,
						screenshotMessage: locales.SCREENSHOT_RECORDING,
						showScreenshotLink: true,
					});
				} else if (!workspaceSettings.screenshotsEnabled && item.turnedOn) {
					this.setState({
						showScreenshotNotification: false,
					});
				} else {
					message = item.message;
					this.setState({
						showScreenshotNotification: !item.isClosed,
						screenshotMessage: message,
						showScreenshotLink:
							typeof item.turnedOn === 'undefined' ? true : item.turnedOn,
					});
				}
			}
		} else {
			if (workspaceSettings.screenshotsEnabled) {
				this.setState({
					showScreenshotNotification: true,
					screenshotMessage: locales.SCREENSHOT_RECORDING,
					showScreenshotLink: true,
				});
			}
		}
	}

	async onBackendScreenshotNotification(notification) {
		const { list } = await this.getScreenshotNotificationInfo();
		let index = list.findIndex(
			(item) =>
				item.workspaceId === notification.workspaceId &&
				item.userId === notification.userId
		);
		if (index >= 0) {
			list[index].isClosed = false;
			list[index].turnedOn = notification.on;
			list[index].message = notification.message;
		} else {
			list.push({
				userId: notification.userId,
				workspaceId: notification.workspaceId,
				isClosed: false,
				turnedOn: notification.on,
				message: notification.message,
			});
		}
		this.setState({
			showScreenshotNotification: true,
			screenshotMessage: notification.message,
			showScreenshotLink: notification.on,
		});

		localStorage.setItem(
			'isScreenshotMessageRed',
			JSON.stringify(list),
			getLocalStorageEnums().PERMANENT_PREFIX
		);
	}

	async closeScreenshotNotification() {
		const { activeWorkspaceId, userId, list } =
			await this.getScreenshotNotificationInfo();
		if (list.length === 0) {
			list.push({
				userId: userId,
				workspaceId: activeWorkspaceId,
				isClosed: true,
			});
		} else {
			let index = list.findIndex(
				(item) =>
					item.workspaceId === activeWorkspaceId && item.userId === userId
			);
			if (index >= 0) {
				list[index].isClosed = true;
			} else {
				list.push({
					userId: userId,
					workspaceId: activeWorkspaceId,
					isClosed: true,
				});
			}
		}

		this.setState({
			showScreenshotNotification: false,
		});

		localStorage.setItem(
			'isScreenshotMessageRed',
			JSON.stringify(list),
			getLocalStorageEnums().PERMANENT_PREFIX
		);
	}

	goBack() {
		this.props.goBackTo();
	}

	goToScreenshotsHelp() {
		openExternal(`${environment.home}/help/extra-features/screenshots`);
	}

	async beforeWorkspaceChange() {
		this.setState({
			showScreenshotNotification: false,
		});

		if (_interval) {
			clearInterval(_interval);
			_interval = null;
		}

		const { activeWorkspaceId, userId, workspaceSettings, list } =
			await this.getScreenshotNotificationInfo();
		let index = list.findIndex(
			(item) =>
				item.workspaceId === activeWorkspaceId &&
				item.userId === userId &&
				!item.isClosed
		);
		if (index >= 0) {
			return; // has unShown
		}

		if (workspaceSettings.screenshotsEnabled) {
			// kad se vrati na taj ws, nek nadje poruku
			this.onBackendScreenshotNotification({
				workspaceId: activeWorkspaceId,
				userId,
				on: true,
				message: locales.SCREENSHOT_RECORDING,
			});
		}
		this.setState({
			showScreenshotNotification: false,
		});
	}

	workspaceChange() {
		this.props.workspaceChanged();
	}

	handleRefresh() {
		this.props.handleRefresh(true);
	}

	render() {
		return (
			<div>
				<div
					className={
						this.state.isMenuOpen || this.state.isNotificationsDropdownOpen
							? 'invisible-menu'
							: 'disabled'
					}
					onClick={this.closeMenus.bind(this)}
				></div>
				<div className={this.props.isOffline ? 'header-offline' : 'disabled'}>
					Offline
				</div>
				<div className="header">
					<div className="self-hosted-url__logo">
						<a target={'_blank'} href={this.state.clockifyLink}>
							<span className="logo"></span>
						</a>
					</div>
					<div>
						<div
							onClick={this.handleRefresh}
							title={locales.REFRESH}
							className={this.props.showSync ? 'refresh-icon' : 'disabled'}
						></div>
						{this.props.showActions && (
							<Notifications
								onClick={this.openNotificationsDropdown.bind(this)}
								isDropdownOpen={this.state.isNotificationsDropdownOpen}
								toaster={this.props.toaster}
								changeWorkspaceTo={this.selectWorkspace}
							/>
						)}
						{this.props.showActions && (
							<div
								className={this.props.showActions ? 'actions' : 'disabled'}
								title={locales.SETTINGS}
								onClick={this.openMenu.bind(this)}
							>
								<Menu
									isOpen={this.state.isMenuOpen}
									mode={this.props.mode}
									manualModeDisabled={this.props.manualModeDisabled}
									changeModeToManual={this.changeToManualMode.bind(this)}
									changeModeToTimer={this.changeToTimerMode.bind(this)}
									disableManual={this.props.disableManual}
									disableAutomatic={this.props.disableAutomatic}
									workspaceSettings={this.props.workspaceSettings}
									beforeWorkspaceChange={this.beforeWorkspaceChange.bind(this)}
									workspaceChanged={this.workspaceChange.bind(this)}
									toaster={this.props.toaster}
									clearEntries={this.props.clearEntries}
									isTrackingDisabled={this.props.isTrackingDisabled}
									selectWorkspace={this.selectWorkspace}
								/>
							</div>
						)}
						<span
							className={this.props.backButton ? 'header-back' : 'disabled'}
							onClick={this.goBack.bind(this)}
						>
							{locales.BACK}
						</span>
					</div>
				</div>
				{this.state.showScreenshotNotification && (
					<div
						className={
							this.state.showScreenshotNotification
								? 'screenshot-notification'
								: 'disabled'
						}
					>
						<div className="screenshot-notification__info_and_close_button">
							<span className="screenshot-notification__info">
								{this.state.screenshotMessage}
								{this.state.showScreenshotLink && (
									<a
										href="https://clockify.me/screenshot-recording-app"
										target={'_blank'}
										className="screenshot-notification__action_buttons--help"
									>
										{
											locales.ACTIVITY_TABS__SCREENSHOTS__NO_SCREENSHOTS_PROMO_BTN
										}
									</a>
								)}
							</span>
							<span
								className="screenshot-notification__close"
								onClick={this.closeScreenshotNotification.bind(this)}
							></span>
						</div>
					</div>
				)}
				<hr className={!this.state.isLoggedIn ? 'header__break' : 'disabled'} />
			</div>
		);
	}
}

export default Header;
