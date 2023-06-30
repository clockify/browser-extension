import * as moment from 'moment-timezone';
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../sass/main-integration.scss';
import locales from './helpers/locales';
import { Application } from './application';
import { checkConnection } from './components/check-connection';
import ErrorBoundary from './components/error-boundary';
import ClockifyButton from './components/integrationPopup/ClockifyButton';
import { offlineStorage } from './helpers/offlineStorage';

offlineStorage.load();

function getInactiveIcon() {
	return '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" height="16" width="16"><path d="m 10.461549,5.5284395 3.642277,-3.6422765 1.040649,1.0406505 -3.642276,3.642309 z M 8.9656137,9.3008298 c -0.7154471,0 -1.300813,-0.5853659 -1.300813,-1.300813 0,-0.7154472 0.5853659,-1.300813 1.300813,-1.300813 0.7154472,0 1.3008133,0.5853658 1.3008133,1.300813 0,0.7154471 -0.5853661,1.300813 -1.3008133,1.300813 z m 6.2439023,3.7723572 -1.04065,1.04065 -3.642276,-3.642276 1.04065,-1.0407149 z" fill="#5A6B7B"></path><path d="m 9.0306543,13.593496 c 0.7154472,0 1.4308947,-0.130081 2.0813017,-0.390244 l 1.821138,1.821139 C 11.762362,15.674797 10.461549,16 9.095695,16 4.6729307,16 1.0956949,12.422765 1.0956949,8.0000004 1.0956949,3.5772361 4.6729307,3.65e-7 9.095695,3.65e-7 c 1.430895,0 2.731708,0.390243865 3.837399,0.975609665 L 11.176996,2.7317077 C 10.52659,2.4715451 9.8111421,2.3414637 9.095695,2.3414637 c -3.1219513,0 -5.593496,2.5365854 -5.593496,5.593496 -0.06504,3.1219513 2.4065041,5.6585363 5.5284553,5.6585363 z" fill="#5A6B7B"></path></svg>';
}

function getActiveIcon() {
	return '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" height="16" width="16"><path d="m 10.461549,5.5284395 3.642277,-3.6422765 1.040649,1.0406505 -3.642276,3.642309 z M 8.9656137,9.3008298 c -0.7154471,0 -1.300813,-0.5853659 -1.300813,-1.300813 0,-0.7154472 0.5853659,-1.300813 1.300813,-1.300813 0.7154472,0 1.3008133,0.5853658 1.3008133,1.300813 0,0.7154471 -0.5853661,1.300813 -1.3008133,1.300813 z m 6.2439023,3.7723572 -1.04065,1.04065 -3.642276,-3.642276 1.04065,-1.0407149 z" fill="#03A9F4"></path><path d="m 9.0306543,13.593496 c 0.7154472,0 1.4308947,-0.130081 2.0813017,-0.390244 l 1.821138,1.821139 C 11.762362,15.674797 10.461549,16 9.095695,16 4.6729307,16 1.0956949,12.422765 1.0956949,8.0000004 1.0956949,3.5772361 4.6729307,3.65e-7 9.095695,3.65e-7 c 1.430895,0 2.731708,0.390243865 3.837399,0.975609665 L 11.176996,2.7317077 C 10.52659,2.4715451 9.8111421,2.3414637 9.095695,2.3414637 c -3.1219513,0 -5.593496,2.5365854 -5.593496,5.593496 -0.06504,3.1219513 2.4065041,5.6585363 5.5284553,5.6585363 z" fill="#03A9F4"></path></svg>';
}

function getClockifyButtonHTML(props) {
	const { active, small, options } = props;
	const container = document.createElement('div');
	const icon = active ? getActiveIcon() : getInactiveIcon();
	const text = document.createElement('span');

	const containerStyles = {
		display: 'flex',
		alignItems: 'center',
		cursor: 'pointer',
	};
	Object.assign(container.style, containerStyles);

	text.innerHTML = `<span class=${
		active
			? 'clockify-button-active clockify-button-active-span'
			: 'clockify-button-inactive clockify-button-inactive-span'
	}>
    ${!active ? locales.START_TIMER : locales.STOP_TIMER}
  </span>`;
	const textStyles = {
		marginLeft: '5px',
		float: 'none',
		position: 'relative',
	};

	if (active) {
		textStyles.color = '#03A9F4';
	} else {
		textStyles.color = options.inactiveButtonColor || '#444444';
	}
	Object.assign(text.style, textStyles);

	container.innerHTML = icon;
	if (!small) {
		container.appendChild(text);
	}
	return container;
}

/* Temporary workaround for secondary monitors on MacOS where redraws don't happen
 * @See https://bugs.chromium.org/p/chromium/issues/detail?id=971701
 */
function Mac() {
	if (
		// From testing the following conditions seem to indicate that the popup was opened on a secondary monitor
		window.screenLeft < 0 ||
		window.screenTop < 0 ||
		window.screenLeft > window.screen.width ||
		window.screenTop > window.screen.height
	) {
		chrome.runtime.getPlatformInfo(function (info) {
			if (info.os === 'mac') {
				const fontFaceSheet = new CSSStyleSheet();
				fontFaceSheet.insertRule(`
        @keyframes redraw {
          0% {
            opacity: 1;
          }
          100% {
            opacity: .99;
          }
        }
      `);
				fontFaceSheet.insertRule(`
        html {
          animation: redraw 1s linear infinite;
        }
      `);
				document.adoptedStyleSheets = [
					...document.adoptedStyleSheets,
					fontFaceSheet,
				];
			}
		});
	}
}

if (
	window.location.href.includes('chrome-extension://') ||
	window.location.href.includes('moz-extension://')
) {
	import('antd/lib/date-picker/style/css');
	import('antd/lib/switch/style/css');
	import('../sass/main.scss');

	window.mountHtmlElement = document.getElementById('mount');
	window.reactRoot = createRoot(window.mountHtmlElement);

	document.addEventListener('DOMContentLoaded', async () => {
		await checkConnection();

		Mac();
		const application = new Application();

		localStorage.setItem('timeZone', moment.tz.guess());

		application.afterLoad();
	});
} else {
	let integrationRoots = [];

	const renderClockifyButton = (props, buttonId = 0) => {
		let counter = 0;
		const intervalId = setTimeout(() => {
			const entryPoint = document.querySelector(`.clockifyButtonId${buttonId}`);
			if (entryPoint) {
				const currBtnProps = props?.btnProps[buttonId];
				if (!currBtnProps) return;

				if (currBtnProps.active) {
					entryPoint.classList.toggle('active', true);
				} else {
					entryPoint.classList.toggle('active', false);
				}

				function createHTMLButton() {
					currBtnProps.newRoot = false;
					entryPoint.innerHTML = '';
					entryPoint.appendChild(getClockifyButtonHTML(currBtnProps));
				}

				function renderToRoot(args = { forceStartTimer: false }) {
					integrationRoots[buttonId].render(
						<ErrorBoundary fallback={<p>Clockify: reload page</p>}>
							<ClockifyButton
								{...currBtnProps}
								{...(buttonId === 0
									? props.popupProps
									: {
											inProgressDescription:
												props.popupProps.inProgressDescription,
									})}
								updateButtonProps={(btnProps, popupProps) =>
									window.updateButtonProperties(
										btnProps ? { ...btnProps, buttonId: buttonId } : { buttonId },
										popupProps
									)
								}
								forceStart={args.forceStartTimer}
							/>
						</ErrorBoundary>
					);
				}

				function createReactRoot() {
					if (integrationRoots[buttonId]) {
						integrationRoots[buttonId].unmount();
						delete integrationRoots[buttonId];
					}
					integrationRoots[buttonId] = createRoot(entryPoint, {
						identifierPrefix: buttonId,
					});
				}

				function addClickHandlerToHTMLButton() {
					function clickHandler(e) {
						e.preventDefault();
						e.stopPropagation();
						createReactRoot();
						renderToRoot({ forceStartTimer: true });
					}
					entryPoint.addEventListener('click', clickHandler, false);
				}

				//helpers for creating HTML/React button
				function isFirstRender() {
					return (
						currBtnProps.newRoot &&
						!integrationRoots[buttonId] &&
						!props.popupProps?.manualMode
					);
				}

				function isUpdatedHTMLButton() {
					return (
						!currBtnProps.newRoot &&
						!integrationRoots[buttonId] &&
						!props.popupProps?.manualMode
					);
				}
				//if react mount point exists, render to it
				if (integrationRoots[buttonId]) {
					// if entry point is empty, it means that button was removed from DOM,
					// so we render HTML button again
					if (!entryPoint.firstChild) {
						createHTMLButton();
						addClickHandlerToHTMLButton();
					} else {
						renderToRoot();
					}
				} else {
					if (isFirstRender()) {
						createHTMLButton();
						addClickHandlerToHTMLButton();
					} else if (isUpdatedHTMLButton()) {
						createHTMLButton();
					} else if (props.popupProps?.manualMode) {
						createReactRoot();
						renderToRoot();
					}
				}
			} else {
				// if no entry point, unmount react root
				integrationRoots[buttonId]?.unmount();
				delete integrationRoots[buttonId];
			}
			counter++;
			if (counter > 5) {
				clearTimeout(intervalId);
			}
		}, 700);
	};

	window.updateButtonProperties = ((
		props = {
			popupProps: {},
			btnProps: [],
		}
	) => {
		return (newBtnProps, newPopupProps) => {
			if (newBtnProps) {
				if (!props.btnProps[newBtnProps.buttonId]) {
					props.btnProps[newBtnProps.buttonId] = {};
				}
				if (
					newBtnProps.title !== props.btnProps[newBtnProps.buttonId].title &&
					newBtnProps.title
				) {
					const currButton = document.querySelector(
						'.clockifyButtonId' + newBtnProps.buttonId
					);
					if (currButton) {
						currButton.title = newBtnProps.title;
					}
				}
				props.btnProps[newBtnProps.buttonId] = {
					...props.btnProps[newBtnProps.buttonId],
					...newBtnProps,
				};
			}

			if (newPopupProps) {
				if (!('manualMode' in newPopupProps)) {
					newPopupProps.manualMode = false;
				}
				props.popupProps = { ...props.popupProps, ...newPopupProps };
			}
			renderClockifyButton(props, newBtnProps?.buttonId);
		};
	})();
}
