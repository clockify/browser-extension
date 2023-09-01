import React, { useState, useEffect } from 'react';
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
			viewBox="0 0 16 16"
			xmlns="http://www.w3.org/2000/svg"
			xmlnsXlink="http://www.w3.org/1999/xlink"
			height="16"
			width="16"
		>
			<path
				d="m 10.461549,5.5284395 3.642277,-3.6422765 1.040649,1.0406505 -3.642276,3.642309 z M 8.9656137,9.3008298 c -0.7154471,0 -1.300813,-0.5853659 -1.300813,-1.300813 0,-0.7154472 0.5853659,-1.300813 1.300813,-1.300813 0.7154472,0 1.3008133,0.5853658 1.3008133,1.300813 0,0.7154471 -0.5853661,1.300813 -1.3008133,1.300813 z m 6.2439023,3.7723572 -1.04065,1.04065 -3.642276,-3.642276 1.04065,-1.0407149 z"
				fill="#03A9F4"
			></path>
			<path
				d="m 9.0306543,13.593496 c 0.7154472,0 1.4308947,-0.130081 2.0813017,-0.390244 l 1.821138,1.821139 C 11.762362,15.674797 10.461549,16 9.095695,16 4.6729307,16 1.0956949,12.422765 1.0956949,8.0000004 1.0956949,3.5772361 4.6729307,3.65e-7 9.095695,3.65e-7 c 1.430895,0 2.731708,0.390243865 3.837399,0.975609665 L 11.176996,2.7317077 C 10.52659,2.4715451 9.8111421,2.3414637 9.095695,2.3414637 c -3.1219513,0 -5.593496,2.5365854 -5.593496,5.593496 -0.06504,3.1219513 2.4065041,5.6585363 5.5284553,5.6585363 z"
				fill="#03A9F4"
			></path>
		</svg>
	);
}

function getInactiveIcon() {
	return (
		<svg
			viewBox="0 0 16 16"
			xmlns="http://www.w3.org/2000/svg"
			xmlnsXlink="http://www.w3.org/1999/xlink"
			height="16"
			width="16"
		>
			<path
				d="m 10.461549,5.5284395 3.642277,-3.6422765 1.040649,1.0406505 -3.642276,3.642309 z M 8.9656137,9.3008298 c -0.7154471,0 -1.300813,-0.5853659 -1.300813,-1.300813 0,-0.7154472 0.5853659,-1.300813 1.300813,-1.300813 0.7154472,0 1.3008133,0.5853658 1.3008133,1.300813 0,0.7154471 -0.5853661,1.300813 -1.3008133,1.300813 z m 6.2439023,3.7723572 -1.04065,1.04065 -3.642276,-3.642276 1.04065,-1.0407149 z"
				fill="#5A6B7B"
			></path>
			<path
				d="m 9.0306543,13.593496 c 0.7154472,0 1.4308947,-0.130081 2.0813017,-0.390244 l 1.821138,1.821139 C 11.762362,15.674797 10.461549,16 9.095695,16 4.6729307,16 1.0956949,12.422765 1.0956949,8.0000004 1.0956949,3.5772361 4.6729307,3.65e-7 9.095695,3.65e-7 c 1.430895,0 2.731708,0.390243865 3.837399,0.975609665 L 11.176996,2.7317077 C 10.52659,2.4715451 9.8111421,2.3414637 9.095695,2.3414637 c -3.1219513,0 -5.593496,2.5365854 -5.593496,5.593496 -0.06504,3.1219513 2.4065041,5.6585363 5.5284553,5.6585363 z"
				fill="#5A6B7B"
			></path>
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

const Button = (props) => {
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
			}}
		>
			{props.active ? getActiveIcon() : getInactiveIcon()}
			{!props.small && (
				<span
					style={styles}
					className={
						props.active
							? 'clockify-button-active clockify-button-active-span'
							: 'clockify-button-inactive clockify-button-inactive-span'
					}
				>
					{!props.active
						? clockifyLocales.START_TIMER
						: clockifyLocales.STOP_TIMER}
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
		isDarkMode: false,
		showPostStartPopup: true,
	});

	const setIsPopupOpen = (isOpen) => {
		setState((state) => ({
			...state,
			isPopupOpen: isOpen,
		}));
	};

	const handleClick = (e) => {
		if (e) {
			e.preventDefault();
			e.stopPropagation();
		}
		buttonClicked(props.title, props.options, props.inProgressDescription);
	};

	const syncDarkMode = async () => {
		const userId = await localStorage.getItem('userId');
		const darkMode = await localStorage.getItem('darkMode');
		const darkModeFromStorageForUser =
			darkMode &&
			JSON.parse(darkMode).filter((darkMode) => darkMode.userId === userId)
				.length > 0
				? JSON.parse(darkMode).filter(
						(darkMode) => darkMode.userId === userId
				  )[0]
				: null;
		if (darkModeFromStorageForUser) {
			setState((state) => ({
				...state,
				isDarkMode: darkModeFromStorageForUser.enabled,
			}));
		}
	};

	const onChangedListener = (changes) => {
		const changedItems = Object.keys(changes);
		if (changedItems.includes('permanent_darkMode')) {
			syncDarkMode();
		}
		if (changedItems.includes('workspaceSettings')) {
			setState((state) => ({
				...state,
				workspaceSettings: JSON.parse(changes.workspaceSettings.newValue),
			}));
		}
	};

	useEffect(() => {
		aBrowser.storage.onChanged.addListener(onChangedListener);
		const asyncEffect = async () => {
			aBrowser.storage.local.get(
				['workspaceSettings', 'userSettings', 'showPostStartPopup'],
				({ workspaceSettings, userSettings, showPostStartPopup }) => {
					workspaceSettings =
						workspaceSettings && JSON.parse(workspaceSettings);
					userSettings = userSettings && JSON.parse(userSettings);
					setState((state) => ({
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
			setState((state) => ({
				...state,
				timeEntry: props.timeEntry,
				manualMode: props.manualMode,
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
			if (entry.message) alert(entry.message);
			setState((state) => ({
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
			const isUserOwnerOrAdmin = await localStorage.getItem(
				'isUserOwnerOrAdmin'
			);
			const wasRegionalEverAllowed = await localStorage.getItem(
				'wasRegionalEverAllowed'
			);
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
		const appendWebsiteURL = await localStorage.getItem(
			'permanent_appendWebsiteURL'
		);
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
				title?.split(pipeSeparator)[0] ===
					inProgressDescription?.split(pipeSeparator)[0]
			) {
				aBrowser.runtime.sendMessage(
					{
						eventName: 'endInProgress',
					},
					(response) => {
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
						if (response.status === 400) {
							const msg = clockifyLocales.CANNOT_END_ENTRY;
							if (_clockifyShowPostStartPopup) {
								aBrowser.runtime.sendMessage(
									{
										eventName: 'fetchEntryInProgress',
									},
									(response) => {
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
							setState((state) => ({
								...state,
								isPopupOpen: false,
							}));
						}
					}
				);
			} else {
				if (timeEntryOptionsInvoked.description === '') {
					alert(clockifyLocales.ENTER_DESCRIPTION);
					_waitingForResponse = false; // ?
					return;
				}
				aBrowser.runtime.sendMessage(
					{
						eventName: 'startWithDescription',
						options: timeEntryOptionsInvoked,
					},
					(response) => {
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
							if (_clockifyShowPostStartPopup) {
								const msg = `${clockifyLocales.COMPLETE_CURRENT_ENTRY}!<br/>${clockifyLocales.ENTER_REQUIRED_FIEEDS_OR_EDIT_WORKSPACE_SETTINGS}`;
								aBrowser.storage.local.get(
									['timeEntryInProgress'],
									(result) => {
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
									}
								);
							} else {
								msg =
									clockifyLocales.CANNOT_START_ENTRY_WITHOUT_PROJECT +
									'. ' +
									clockifyLocales.EDIT_YOUR_TIME_ENTRY +
									'. ' +
									clockifyLocales.CREATE_TIME_ENTRY_USING_DASHBOARD +
									'.';
								alert(msg);
								_waitingForResponse = false;
							}
						} else {
							let noTags = true;
							const active = true;
							props.updateButtonProps({ title, active });
							inProgressDescription = title;
							const entry = response.data;
							const { tagNames } = timeEntryOptionsInvoked;
							if (tagNames && tagNames.length > 0 && entry.tags.length > 0) {
								noTags = false;
								aBrowser.runtime.sendMessage(
									{
										eventName: 'fetchEntryInProgress',
									},
									(response) => {
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
			if (
				error.toString().toLowerCase().includes('extension context invalidated')
			) {
				alert(
					`${clockifyLocales.EXT_RELOADED}.\n${clockifyLocales.REFRESH_THE_PAGE}!`
				);
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
				ariaHideApp={false}
			>
				<div
					className={`clockify-integration-popup${
						state.isDarkMode ? ' clockify-dark-mode' : ''
					}`}
				>
					<div className="clockify-integration-popup-header">
						{props.manualMode ? (
							<div className="clockify-manual-entry-header-container">
								<p className="clockify-manual-entry-header-text">
									Time: {props.timeEntry.originalInput}
								</p>
							</div>
						) : (
							<Button
								handleClick={handleClick}
								active={props.active}
								style={{ marginTop: '10px', marginLeft: '20px' }}
							/>
						)}
						<img
							src={aBrowser.runtime.getURL('assets/images/closeX.svg')}
							alt="Close"
							className="clockify-integration-popup-close-icon"
							onClick={() => {
								setIsPopupOpen(false);
								if (props.manualMode) {
									props.updateButtonProps(null, { manualMode: false });
								}
							}}
						/>
					</div>
					{state.timeEntry && state.workspaceSettings && state.userSettings ? (
						props.manualMode ? (
							<EditFormManual
								timeEntry={state.timeEntry}
								workspaceSettings={state.workspaceSettings}
								timeFormat={state.userSettings.timeFormat}
								userSettings={state.userSettings}
								integrationMode
								inProgress={true}
								closeIntegrationPopup={() => {
									setIsPopupOpen(false);
									props.updateButtonProps(null, { manualMode: false });
								}}
							/>
						) : (
							<EditForm
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
