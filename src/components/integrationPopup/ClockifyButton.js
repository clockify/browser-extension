import React, { useEffect, useRef, useState } from 'react';
import Modal from 'react-modal';
import { getBrowser } from '../../helpers/browser-helper';
import EditForm from '../edit-form.component';
import EditFormManual from '../edit-form-manual.component';
import { offlineStorage } from '../../helpers/offlineStorage';

Modal.defaultStyles = {
	zIndex: 2147483647,
};

offlineStorage.load();

const aBrowser = getBrowser();
let _waitingForResponse = false;

function getActiveIcon() {
	return (
		<svg
			width="15"
			height="16"
			viewBox="0 0 15 16"
			fill="none"
			xmlns="http://www.w3.org/2000/svg">
			<path
				d="M11.0065 2.04616C11.4838 1.56806 11.3811 0.764579 10.7508 0.522636C9.8712 0.185007 8.91622 0 7.91809 0C3.54505 0 0 3.5511 0 7.93162C0 12.3121 3.54505 15.8632 7.91809 15.8632C8.91006 15.8632 9.85941 15.6805 10.7345 15.3468C11.3664 15.1059 11.4702 14.3009 10.992 13.8219C10.6822 13.5115 10.2133 13.4391 9.79745 13.5775C9.20813 13.7738 8.57779 13.88 7.92268 13.88C4.6429 13.88 1.9841 11.2167 1.9841 7.93131C1.9841 4.64592 4.6429 1.98259 7.92268 1.98259C8.58253 1.98259 9.21724 2.09041 9.81022 2.28937C10.2263 2.42902 10.6962 2.35702 11.0065 2.04616Z"
				fill="#03A9F4"
			/>
			<path
				d="M9.11681 8.02279C9.11681 8.57666 8.66782 9.02564 8.11396 9.02564C7.5601 9.02564 7.11111 8.57666 7.11111 8.02279C7.11111 7.46893 7.5601 7.01994 8.11396 7.01994C8.66782 7.01994 9.11681 7.46893 9.11681 8.02279Z"
				fill="#03A9F4"
			/>
			<path
				d="M9.65974 5.15543C9.3005 5.5124 9.3005 6.09115 9.65974 6.44812C10.019 6.80509 10.6014 6.80509 10.9607 6.44812L13.9528 3.47494C14.312 3.11797 14.312 2.53922 13.9528 2.18225C13.5936 1.8253 13.0111 1.8253 12.6519 2.18225L9.65974 5.15543Z"
				fill="#03A9F4"
			/>
			<path
				d="M9.65974 10.7078C9.3005 10.3508 9.3005 9.7721 9.65974 9.41513C10.019 9.05816 10.6014 9.05816 10.9607 9.41513L13.9528 12.3883C14.312 12.7453 14.312 13.324 13.9528 13.681C13.5936 14.0379 13.0111 14.0379 12.6519 13.681L9.65974 10.7078Z"
				fill="#03A9F4"
			/>{' '}
		</svg>
	);
}

function getInactiveIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
			{' '}
			<path
				d="M11.0065 2.04616C11.4838 1.56806 11.3811 0.764579 10.7508 0.522636C9.8712 0.185007 8.91622 0 7.91809 0C3.54505 0 0 3.5511 0 7.93162C0 12.3121 3.54505 15.8632 7.91809 15.8632C8.91006 15.8632 9.85941 15.6805 10.7345 15.3468C11.3664 15.1059 11.4702 14.3009 10.992 13.8219C10.6822 13.5115 10.2133 13.4391 9.79745 13.5775C9.20813 13.7738 8.57779 13.88 7.92268 13.88C4.6429 13.88 1.9841 11.2167 1.9841 7.93131C1.9841 4.64592 4.6429 1.98259 7.92268 1.98259C8.58253 1.98259 9.21724 2.09041 9.81022 2.28937C10.2263 2.42902 10.6962 2.35702 11.0065 2.04616Z"
				fill="#60747D"
			/>{' '}
			<path
				d="M9.11681 8.02279C9.11681 8.57666 8.66782 9.02564 8.11396 9.02564C7.5601 9.02564 7.11111 8.57666 7.11111 8.02279C7.11111 7.46893 7.5601 7.01994 8.11396 7.01994C8.66782 7.01994 9.11681 7.46893 9.11681 8.02279Z"
				fill="#60747D"
			/>{' '}
			<path
				d="M9.65974 5.15543C9.3005 5.5124 9.3005 6.09115 9.65974 6.44812C10.019 6.80509 10.6014 6.80509 10.9607 6.44812L13.9528 3.47494C14.312 3.11797 14.312 2.53922 13.9528 2.18225C13.5936 1.8253 13.0111 1.8253 12.6519 2.18225L9.65974 5.15543Z"
				fill="#60747D"
			/>{' '}
			<path
				d="M9.65974 10.7078C9.3005 10.3508 9.3005 9.7721 9.65974 9.41513C10.019 9.05816 10.6014 9.05816 10.9607 9.41513L13.9528 12.3883C14.312 12.7453 14.312 13.324 13.9528 13.681C13.5936 14.0379 13.0111 14.0379 12.6519 13.681L9.65974 10.7078Z"
				fill="#60747D"
			/>{' '}
		</svg>
	);
}

function objInvokeIfFunction(obj) {
	const result = {};
	for (const key of Object.keys(obj)) {
		result[key] = invokeIfFunction(obj[key]);
	}
	return result;
}

function invokeIfFunction(trial) {
	if (trial instanceof Function) {
		return trial();
	}
	return trial;
}

const Button = props => {
	const styles = { marginLeft: '5px', float: 'none', position: 'relative' };
	if (props.active) {
		styles.color = '#03A9F4';
	} else {
		styles.color = props.inactiveButtonColor || '#444444';
	}
	return (
		<div
			id="clockifyButtonReact"
			onClick={props.handleClick}
			style={{
				display: 'flex',
				alignItems: 'center',
				cursor: 'pointer',
				...props.style,
			}}>
			{props.active ? getActiveIcon() : getInactiveIcon()}
			{!props.small && (
				<span
					style={styles}
					className={
						props.active
							? 'clockify-button-active clockify-button-active-span'
							: 'clockify-button-inactive clockify-button-inactive-span'
					}>
					{!props.active ? clockifyLocales.START_TIMER : clockifyLocales.STOP_TIMER}
				</span>
			)}
		</div>
	);
};

// const StyledPopupDiv = styled.div`${styles} ${antdSwitchStyle}`;

function ClockifyButton(props) {
	const [state, setState] = useState({
		workspaceSettings: null,
		userSettings: null,
		isPopupOpen: false,
		timeEntry: null,
		isDarkTheme: false,
		showPostStartPopup: true,
	});

	const setIsPopupOpen = isOpen => {
		setState(state => ({
			...state,
			isPopupOpen: isOpen,
		}));
	};

	const editFormRef = useRef();

	const getTimeEntryDetails = () => {
		if (editFormRef.current) {
			return editFormRef.current.getAllFieldData();
		}
	};
	const handleClick = e => {
		if (e) {
			e.preventDefault();
			e.stopPropagation();
		}
		buttonClicked(props.title, props.options, props.inProgressDescription);
	};

	const syncDarkMode = async () => {
		const appStore = await localStorage.getItem('appStore');
		const appStoreParsed = JSON.parse(appStore).state;

		const userId = appStoreParsed.userData.id;
		const usersDarkThemePreference = appStoreParsed.usersDarkThemePreference;

		const userPreference = usersDarkThemePreference.find(pref => pref.userId === userId);
		const isDarkTheme = userPreference ? userPreference.enabled : false;

		setState(prevState => ({
			...prevState,
			isDarkTheme,
		}));
	};

	const onChangedListener = changes => {
		const changedItems = Object.keys(changes);
		if (changedItems.includes('appStore')) {
			syncDarkMode();
		}
		if (changedItems.includes('workspaceSettings')) {
			setState(state => ({
				...state,
				workspaceSettings: JSON.parse(changes.workspaceSettings.newValue || '{}'),
			}));
		}
	};

	useEffect(() => {
		aBrowser.storage.onChanged.addListener(onChangedListener);
		const asyncEffect = async () => {
			aBrowser.storage.local.get(
				['workspaceSettings', 'userSettings', 'showPostStartPopup'],
				({ workspaceSettings, userSettings, showPostStartPopup }) => {
					workspaceSettings = workspaceSettings && JSON.parse(workspaceSettings);
					userSettings = userSettings && JSON.parse(userSettings);
					setState(state => ({
						...state,
						workspaceSettings,
						userSettings,
						showPostStartPopup: showPostStartPopup ?? true,
					}));
				}
			);
			syncDarkMode();
		};
		asyncEffect();

		if (props.forceStart) {
			handleClick();
		}
		return () => {
			//cleanup
			aBrowser.storage.onChanged.removeListener(onChangedListener);
		};
	}, []);

	useEffect(() => {
		//when manual input calls re-render
		if (props.timeEntry) {
			setState(state => ({
				...state,
				timeEntry: props.timeEntry,
				manualMode: props.manualMode,
				copyAsEntry: props.copyAsEntry,
				isPopupOpen: props.isPopupOpen,
			}));
		}
	}, [props.timeEntry]);

	useEffect(() => {
		if (!props.active) {
			setIsPopupOpen(false);
		}
	}, [props.active]);

	function saveEntryAndOpenPopup(entry) {
		aBrowser.storage.local.set({
			timeEntryInProgress: entry,
		});
		if (_clockifyShowPostStartPopup) {
			// OpenPostStartPopupDlg(entry);
			if (entry?.message) alert(entry.message);
			setState(state => ({
				...state,
				isPopupOpen: true,
				timeEntry: entry,
			}));
		}
	}

	async function buttonClicked(title, options, inProgressDescription) {
		if (_waitingForResponse) {
			return;
		}
		let workspaceSettings = await localStorage.getItem('workspaceSettings');
		workspaceSettings = workspaceSettings && JSON.parse(workspaceSettings);
		if (
			workspaceSettings.features &&
			workspaceSettings.features.featureSubscriptionType !== 'SELF_HOSTED' &&
			!workspaceSettings.features.timeTracking
		) {
			const isUserOwnerOrAdmin = await localStorage.getItem('isUserOwnerOrAdmin');
			const wasRegionalEverAllowed = await localStorage.getItem('wasRegionalEverAllowed');
			alert(
				!wasRegionalEverAllowed
					? isUserOwnerOrAdmin
						? clockifyLocales.UPGRADE_REGIONAL_ADMIN
						: clockifyLocales.UPGRADE_REGIONAL
					: isUserOwnerOrAdmin
					? clockifyLocales.SUBSCRIPTION_EXPIRED
					: clockifyLocales.FEATURE_DISABLED_CONTACT_ADMIN
			);
			return;
		}
		const timeEntryOptionsInvoked = objInvokeIfFunction(options);
		title = title || timeEntryOptionsInvoked.description;

		if (options.description instanceof Function) {
			// document.querySelector(`[title="${title}"]`).title =
			// 	timeEntryOptionsInvoked.description;
			title = timeEntryOptionsInvoked.description;
		}
		const appendWebsiteURL = await localStorage.getItem('permanent_appendWebsiteURL');
		let pipeSeparator = ' | ';
		if (appendWebsiteURL) {
			if (title.includes(' | ')) pipeSeparator = ' || ';
			const sufix = `${document.title} - ${window.location.href}`;
			if (!title.includes(sufix)) {
				title += `${pipeSeparator}${sufix}`;
			}
			timeEntryOptionsInvoked.description = title;
		}
		_waitingForResponse = true;
		try {
			if (
				title &&
				title?.split(pipeSeparator)[0] === inProgressDescription?.split(pipeSeparator)[0]
			) {
				let timeEntryId, updatedFieldValues;
				try {
					const timeEntryDetails = getTimeEntryDetails() || {};
					const { entryId, updatedFields } = timeEntryDetails;

					timeEntryId = entryId;
					updatedFieldValues = updatedFields;
				} catch (error) {
					console.log(error);
				}
				if (!timeEntryId) {
					aBrowser.runtime.sendMessage(
						{
							eventName: 'endInProgress',
							options: {
								endedFromIntegration: true,
								integrationName: props.integrationName,
							},
						},
						response => {
							if (!response) {
								_waitingForResponse = false;
								alert(clockifyLocales.YOU_MUST_BE_LOGGED_IN_TO_START);
								return;
							} else if (typeof response === 'string') {
								_waitingForResponse = false;
								alert(response);
								return;
							}
							if (response.status === 400) {
								const msg = clockifyLocales.CANNOT_END_ENTRY;
								if (_clockifyShowPostStartPopup) {
									aBrowser.runtime.sendMessage(
										{
											eventName: 'fetchEntryInProgress',
										},
										response => {
											if (!response) {
												alert(clockifyLocales.TAG__GET__ERROR);
												_waitingForResponse = false;
												return;
											}
											if (typeof response === 'string') {
												alert(response);
												_waitingForResponse = false;
												return;
											}
											const { status, entry: hydratedEntry } = response;
											aBrowser.storage.local.set({
												timeEntryInProgress: hydratedEntry,
											});
											if (hydratedEntry) {
												props.updateButtonProps({ active: true });
												if (!_clockifyPopupDlg) {
													// OpenPostStartPopupDlg(hydratedEntry, msg);
													saveEntryAndOpenPopup(hydratedEntry);
												} else {
													alert(msg);
												}
											}
											_waitingForResponse = false;
										}
									);
								} else {
									_waitingForResponse = false;
									alert(msg);
								}
							} else {
								inProgressDescription = null;
								const active = false;
								props.updateButtonProps({ title, active });
								aBrowser.storage.local.set({
									timeEntryInProgress: null,
								});
								_waitingForResponse = false;
								setState(state => ({
									...state,
									isPopupOpen: false,
								}));
							}
						}
					);
				} else {
					aBrowser.runtime
						.sendMessage({
							eventName: 'updateTimeEntryValues',
							options: {
								entryId: timeEntryId,
								body: updatedFieldValues,
							},
						})
						.then(response => {
							if (response && response.status === 200) {
								aBrowser.runtime.sendMessage(
									{
										eventName: 'endInProgress',
										options: {
											endedFromIntegration: true,
											integrationName: props.integrationName,
										},
									},
									response => {
										if (!response) {
											_waitingForResponse = false;
											alert(clockifyLocales.YOU_MUST_BE_LOGGED_IN_TO_START);
											// this.hideClockifyButtonLinks();
											return;
										} else if (typeof response === 'string') {
											//alert("ClockifyService is temporarily unavailable.");
											_waitingForResponse = false;
											alert(response);
											return;
										}
										if (response.status === 401) {
											alert(clockifyLocales.WORKSPACE_LOCKED);
											_waitingForResponse = false;
											return;
										}
										if (response.status === 400) {
											const msg = clockifyLocales.CANNOT_END_ENTRY;
											if (_clockifyShowPostStartPopup) {
												aBrowser.runtime.sendMessage(
													{
														eventName: 'fetchEntryInProgress',
													},
													response => {
														if (!response) {
															alert(clockifyLocales.TAG__GET__ERROR);
															_waitingForResponse = false;
															return;
														}
														if (typeof response === 'string') {
															alert(response);
															_waitingForResponse = false;
															return;
														}
														const { status, entry: hydratedEntry } =
															response;
														aBrowser.storage.local.set({
															timeEntryInProgress: hydratedEntry,
														});
														if (hydratedEntry) {
															props.updateButtonProps({
																active: true,
															});
															if (!_clockifyPopupDlg) {
																// OpenPostStartPopupDlg(hydratedEntry, msg);
																saveEntryAndOpenPopup(
																	hydratedEntry
																);
															} else {
																alert(msg);
															}
														}
														_waitingForResponse = false;
													}
												);
											} else {
												_waitingForResponse = false;
												alert(msg);
											}
										} else {
											inProgressDescription = null;
											const active = false;
											props.updateButtonProps({ title, active });
											aBrowser.storage.local.set({
												timeEntryInProgress: null,
											});
											_waitingForResponse = false;
											setState(state => ({
												...state,
												isPopupOpen: false,
											}));
										}
									}
								);
							} else {
								const msg = clockifyLocales.CANNOT_END_ENTRY;
								if (_clockifyShowPostStartPopup) {
									aBrowser.runtime.sendMessage(
										{
											eventName: 'fetchEntryInProgress',
										},
										response => {
											if (!response) {
												alert(clockifyLocales.TAG__GET__ERROR);
												_waitingForResponse = false;
												return;
											}
											if (typeof response === 'string') {
												alert(response);
												_waitingForResponse = false;
												return;
											}
											const { status, entry: hydratedEntry } = response;
											aBrowser.storage.local.set({
												timeEntryInProgress: hydratedEntry,
											});
											if (hydratedEntry) {
												props.updateButtonProps({ active: true });
												if (!_clockifyPopupDlg) {
													// OpenPostStartPopupDlg(hydratedEntry, msg);
													saveEntryAndOpenPopup(hydratedEntry);
												} else {
													alert(msg);
												}
											}
											_waitingForResponse = false;
										}
									);
								} else {
									_waitingForResponse = false;
									alert(msg);
								}
							}
						})
						.catch(error => {
							console.log(error);
							const msg = clockifyLocales.CANNOT_END_ENTRY;
							if (_clockifyShowPostStartPopup) {
								aBrowser.runtime.sendMessage(
									{
										eventName: 'fetchEntryInProgress',
									},
									response => {
										if (!response) {
											alert(clockifyLocales.TAG__GET__ERROR);
											_waitingForResponse = false;
											return;
										}
										if (typeof response === 'string') {
											alert(response);
											_waitingForResponse = false;
											return;
										}
										const { status, entry: hydratedEntry } = response;
										aBrowser.storage.local.set({
											timeEntryInProgress: hydratedEntry,
										});
										if (hydratedEntry) {
											props.updateButtonProps({ active: true });
											if (!_clockifyPopupDlg) {
												// OpenPostStartPopupDlg(hydratedEntry, msg);
												saveEntryAndOpenPopup(hydratedEntry);
											} else {
												alert(msg);
											}
										}
										_waitingForResponse = false;
									}
								);
							} else {
								_waitingForResponse = false;
								alert(msg);
							}
						});
				}
			} else {
				if (timeEntryOptionsInvoked.description === '') {
					alert(clockifyLocales.ENTER_DESCRIPTION);
					_waitingForResponse = false; // ?
					return;
				}
				aBrowser.runtime.sendMessage(
					{
						eventName: 'startWithDescription',
						options: {
							...timeEntryOptionsInvoked,
							isStartedFromIntegration: true,
							integrationName: props.integrationName,
						},
					},
					response => {
						if (!response) {
							_waitingForResponse = false;
							alert(clockifyLocales.YOU_MUST_BE_LOGGED_IN_TO_START);
							return;
						} else if (typeof response === 'string') {
							_waitingForResponse = false;
							alert(response);
							return;
						}
						if (response.status === 401) {
							alert(clockifyLocales.WORKSPACE_LOCKED);
							_waitingForResponse = false;
							return;
						}
						if (response.status === 400) {
							if (_clockifyShowPostStartPopup) {
								const msg = `${clockifyLocales.COMPLETE_CURRENT_ENTRY}!<br/>${clockifyLocales.ENTER_REQUIRED_FIEEDS_OR_EDIT_WORKSPACE_SETTINGS}`;
								aBrowser.storage.local.get(['timeEntryInProgress'], result => {
									const { timeEntryInProgress } = result;
									if (timeEntryInProgress) {
										if (!_clockifyPopupDlg) {
											// OpenPostStartPopupDlg(timeEntryInProgress, msg);
											saveEntryAndOpenPopup(timeEntryInProgress);
										}
									} else {
										alert(msg.replaceAll('<br/>', '\n'));
									}
									_waitingForResponse = false;
								});
							} else {
								_waitingForResponse = false;
							}
						} else {
							let noTags = true;
							const active = true;
							props.updateButtonProps({ title, active });
							inProgressDescription = title;
							const entry = response.data;
							const { tagNames } = timeEntryOptionsInvoked;
							if (
								tagNames &&
								tagNames.length > 0 &&
								entry.tags &&
								entry.tags.length > 0
							) {
								noTags = false;
								aBrowser.runtime.sendMessage(
									{
										eventName: 'fetchEntryInProgress',
									},
									response => {
										if (!response) {
											alert(clockifyLocales.TAG__GET__ERROR);
											_waitingForResponse = false;
											return;
										}
										if (typeof response === 'string') {
											alert(response);
											_waitingForResponse = false;
											return;
										}
										const { status, entry: hydratedEntry } = response;
										entry.tags = [...hydratedEntry.tags];
										saveEntryAndOpenPopup(entry); // hydrated
										_waitingForResponse = false;
									}
								);
							}

							if (noTags) {
								_waitingForResponse = false;
								saveEntryAndOpenPopup(entry);
							}
						}
					}
				);
			}
		} catch (error) {
			if (error.toString().toLowerCase().includes('extension context invalidated')) {
				alert(`${clockifyLocales.EXT_RELOADED}.\n${clockifyLocales.REFRESH_THE_PAGE}!`);
			} else {
				alert(
					`${clockifyLocales.EXT_CONTEXT_INVALIDATED}.\n${clockifyLocales.REFRESH_THE_PAGE}!`
				);
			}
		} finally {
			_waitingForResponse = false;
		}
	}

	return (
		<>
			<Button
				handleClick={handleClick}
				active={props.active}
				small={props.small}
				inactiveButtonColor={props.options?.inactiveButtonColor}
			/>
			<Modal
				style={{
					overlay: {
						position: 'fixed',
						zIndex: '2147483647',
						top: '3vh',
						right: '3vw',
					},
					content: {
						zIndex: '2147483646',
					},
				}}
				isOpen={state.isPopupOpen}
				ariaHideApp={false}>
				<div
					className={`clockify-integration-popup${
						state.isDarkTheme ? ' clockify-dark-mode' : ''
					}`}>
					<div className="clockify-integration-popup-header">
						{props.manualMode ? (
							<div className="clockify-manual-entry-header-container">
								<p className="clockify-manual-entry-header-text">
									Time: {props.timeEntry.originalInput}
								</p>
							</div>
						) : props.copyAsEntry ? (
							<div className="clockify-manual-entry-header-container">
								<p className="clockify-manual-entry-header-text">Time and date</p>
							</div>
						) : (
							<></>
						)}
						<img
							src={aBrowser.runtime.getURL('assets/images/closeX.svg')}
							alt="Close"
							className="clockify-integration-popup-close-icon"
							onClick={() => {
								setIsPopupOpen(false);
								if (props.manualMode) {
									props.updateButtonProps(null, {
										manualMode: false,
									});
								}

								if (props.copyAsEntry) {
									props.updateButtonProps(null, {
										copyAsEntry: false,
									});
								}
							}}
						/>
					</div>
					{state.timeEntry && state.workspaceSettings && state.userSettings ? (
						props.manualMode || props.copyAsEntry ? (
							<EditFormManual
								timeEntry={state.timeEntry}
								workspaceSettings={state.workspaceSettings}
								timeFormat={state.userSettings.timeFormat}
								userSettings={state.userSettings}
								integrationMode
								integrationName={props.integrationName}
								inProgress={true}
								closeIntegrationPopup={() => {
									setIsPopupOpen(false);
									props.updateButtonProps(null, {
										manualMode: false,
										copyAsEntry: false,
									});
								}}
								copyAsEntry={props.copyAsEntry}
							/>
						) : (
							<EditForm
								ref={editFormRef}
								timeEntry={state.timeEntry}
								workspaceSettings={state.workspaceSettings}
								timeFormat={state.userSettings.timeFormat}
								userSettings={state.userSettings}
								integrationMode
								inProgress={true}
								closeIntegrationPopup={() => {
									setIsPopupOpen(false);
									props.updateButtonProps(null, {
										manualMode: false,
										copyAsEntry: false,
									});
								}}
							/>
						)
					) : null}
				</div>
			</Modal>
		</>
	);
}

export default ClockifyButton;
