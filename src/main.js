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
import { isChrome } from './helpers/browser-helper';

offlineStorage.load();

let HTMLButtonsWithClickListener = [];

function getInactiveIcon() {
	//return '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" height="16" width="16"><path d="m 10.461549,5.5284395 3.642277,-3.6422765 1.040649,1.0406505 -3.642276,3.642309 z M 8.9656137,9.3008298 c -0.7154471,0 -1.300813,-0.5853659 -1.300813,-1.300813 0,-0.7154472 0.5853659,-1.300813 1.300813,-1.300813 0.7154472,0 1.3008133,0.5853658 1.3008133,1.300813 0,0.7154471 -0.5853661,1.300813 -1.3008133,1.300813 z m 6.2439023,3.7723572 -1.04065,1.04065 -3.642276,-3.642276 1.04065,-1.0407149 z" fill="#5A6B7B"></path><path d="m 9.0306543,13.593496 c 0.7154472,0 1.4308947,-0.130081 2.0813017,-0.390244 l 1.821138,1.821139 C 11.762362,15.674797 10.461549,16 9.095695,16 4.6729307,16 1.0956949,12.422765 1.0956949,8.0000004 1.0956949,3.5772361 4.6729307,3.65e-7 9.095695,3.65e-7 c 1.430895,0 2.731708,0.390243865 3.837399,0.975609665 L 11.176996,2.7317077 C 10.52659,2.4715451 9.8111421,2.3414637 9.095695,2.3414637 c -3.1219513,0 -5.593496,2.5365854 -5.593496,5.593496 -0.06504,3.1219513 2.4065041,5.6585363 5.5284553,5.6585363 z" fill="#5A6B7B"></path></svg>';
	return `<svg width="16" 	height="16" 	viewBox="0 0 16 16" 	xmlns="http://www.w3.org/2000/svg" > 	<path 		d="M11.0065 2.04616C11.4838 1.56806 11.3811 0.764579 10.7508 0.522636C9.8712 0.185007 8.91622 0 7.91809 0C3.54505 0 0 3.5511 0 7.93162C0 12.3121 3.54505 15.8632 7.91809 15.8632C8.91006 15.8632 9.85941 15.6805 10.7345 15.3468C11.3664 15.1059 11.4702 14.3009 10.992 13.8219C10.6822 13.5115 10.2133 13.4391 9.79745 13.5775C9.20813 13.7738 8.57779 13.88 7.92268 13.88C4.6429 13.88 1.9841 11.2167 1.9841 7.93131C1.9841 4.64592 4.6429 1.98259 7.92268 1.98259C8.58253 1.98259 9.21724 2.09041 9.81022 2.28937C10.2263 2.42902 10.6962 2.35702 11.0065 2.04616Z" 		fill="#60747D" 	/> 	<path 		d="M9.11681 8.02279C9.11681 8.57666 8.66782 9.02564 8.11396 9.02564C7.5601 9.02564 7.11111 8.57666 7.11111 8.02279C7.11111 7.46893 7.5601 7.01994 8.11396 7.01994C8.66782 7.01994 9.11681 7.46893 9.11681 8.02279Z" 		fill="#60747D" 	/> 	<path 		d="M9.65974 5.15543C9.3005 5.5124 9.3005 6.09115 9.65974 6.44812C10.019 6.80509 10.6014 6.80509 10.9607 6.44812L13.9528 3.47494C14.312 3.11797 14.312 2.53922 13.9528 2.18225C13.5936 1.8253 13.0111 1.8253 12.6519 2.18225L9.65974 5.15543Z" 		fill="#60747D" 	/> 	<path 		d="M9.65974 10.7078C9.3005 10.3508 9.3005 9.7721 9.65974 9.41513C10.019 9.05816 10.6014 9.05816 10.9607 9.41513L13.9528 12.3883C14.312 12.7453 14.312 13.324 13.9528 13.681C13.5936 14.0379 13.0111 14.0379 12.6519 13.681L9.65974 10.7078Z" 		fill="#60747D" 	/> </svg>`;
}

function getActiveIcon() {
	//return '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" height="16" width="16"><path d="m 10.461549,5.5284395 3.642277,-3.6422765 1.040649,1.0406505 -3.642276,3.642309 z M 8.9656137,9.3008298 c -0.7154471,0 -1.300813,-0.5853659 -1.300813,-1.300813 0,-0.7154472 0.5853659,-1.300813 1.300813,-1.300813 0.7154472,0 1.3008133,0.5853658 1.3008133,1.300813 0,0.7154471 -0.5853661,1.300813 -1.3008133,1.300813 z m 6.2439023,3.7723572 -1.04065,1.04065 -3.642276,-3.642276 1.04065,-1.0407149 z" fill="#03A9F4"></path><path d="m 9.0306543,13.593496 c 0.7154472,0 1.4308947,-0.130081 2.0813017,-0.390244 l 1.821138,1.821139 C 11.762362,15.674797 10.461549,16 9.095695,16 4.6729307,16 1.0956949,12.422765 1.0956949,8.0000004 1.0956949,3.5772361 4.6729307,3.65e-7 9.095695,3.65e-7 c 1.430895,0 2.731708,0.390243865 3.837399,0.975609665 L 11.176996,2.7317077 C 10.52659,2.4715451 9.8111421,2.3414637 9.095695,2.3414637 c -3.1219513,0 -5.593496,2.5365854 -5.593496,5.593496 -0.06504,3.1219513 2.4065041,5.6585363 5.5284553,5.6585363 z" fill="#03A9F4"></path></svg>';
	return `<svg width="15"height="16"viewBox="0 0 15 16"fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.0065 2.04616C11.4838 1.56806 11.3811 0.764579 10.7508 0.522636C9.8712 0.185007 8.91622 0 7.91809 0C3.54505 0 0 3.5511 0 7.93162C0 12.3121 3.54505 15.8632 7.91809 15.8632C8.91006 15.8632 9.85941 15.6805 10.7345 15.3468C11.3664 15.1059 11.4702 14.3009 10.992 13.8219C10.6822 13.5115 10.2133 13.4391 9.79745 13.5775C9.20813 13.7738 8.57779 13.88 7.92268 13.88C4.6429 13.88 1.9841 11.2167 1.9841 7.93131C1.9841 4.64592 4.6429 1.98259 7.92268 1.98259C8.58253 1.98259 9.21724 2.09041 9.81022 2.28937C10.2263 2.42902 10.6962 2.35702 11.0065 2.04616Z" fill="#03A9F4"/><path d="M9.11681 8.02279C9.11681 8.57666 8.66782 9.02564 8.11396 9.02564C7.5601 9.02564 7.11111 8.57666 7.11111 8.02279C7.11111 7.46893 7.5601 7.01994 8.11396 7.01994C8.66782 7.01994 9.11681 7.46893 9.11681 8.02279Z" fill="#03A9F4"/><path d="M9.65974 5.15543C9.3005 5.5124 9.3005 6.09115 9.65974 6.44812C10.019 6.80509 10.6014 6.80509 10.9607 6.44812L13.9528 3.47494C14.312 3.11797 14.312 2.53922 13.9528 2.18225C13.5936 1.8253 13.0111 1.8253 12.6519 2.18225L9.65974 5.15543Z" fill="#03A9F4"/><path d="M9.65974 10.7078C9.3005 10.3508 9.3005 9.7721 9.65974 9.41513C10.019 9.05816 10.6014 9.05816 10.9607 9.41513L13.9528 12.3883C14.312 12.7453 14.312 13.324 13.9528 13.681C13.5936 14.0379 13.0111 14.0379 12.6519 13.681L9.65974 10.7078Z" fill="#03A9F4"/> </svg>`;
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
				document.adoptedStyleSheets = [...document.adoptedStyleSheets, fontFaceSheet];
			}
		});
	}
}

window.getAllDocuments = () => {
	/*
	 * On the Firefox browser, we only want to use iframe documents for integrations that run on applications that use iframes.
	 * The reason for this is that Firefox throws a "Can't access dead object" error that confuses users when we try to save the iframe's document to a constant.
	 */

	function shouldIntegrationHandleIframes() {
		const currentDomain = location.host.split('.').reverse()[1];

		// be aware that array has not to contains always integration name but name of domain that integration runs on
		const integrationsThatShouldHandleIframes = ['teamwork'];

		return integrationsThatShouldHandleIframes.includes(currentDomain);
	}

	if (!isChrome() && !shouldIntegrationHandleIframes()) return [document];

	const iframes = Array.from(document.querySelectorAll('iframe'));
	const iframeDocuments = iframes
		.map(({ contentDocument }) => contentDocument)
		.filter(contentDocument => Boolean(contentDocument))
		.filter(contentDocument => JSON.stringify(contentDocument) !== '{}');
	const documents = [document, ...iframeDocuments];

	return documents;
};

const LoadingElement = () => {
	return <div className="clockify-splash-screen"></div>;
};

function getSiblingButtonId(origin) {
	const previousSibling = origin.previousElementSibling;
	const nextSibling = origin.nextElementSibling;
	const parentContainer = origin.closest('.clockify-widget-container');

	if (previousSibling && previousSibling.classList.contains('clockifyButton')) {
		// Extract the ID from the class name
		const id = previousSibling.className.match(/clockifyButtonId(\d+)/)[1];
		return id;
	}

	if (nextSibling && nextSibling.classList.contains('clockifyButton')) {
		// Extract the ID from the class name
		const id = nextSibling.className.match(/clockifyButtonId(\d+)/)[1];
		return id;
	}

	if (parentContainer && parentContainer.querySelector('.clockifyButton')) {
		// Extract the ID from the class name
		const id = parentContainer
			.querySelector('.clockifyButton')
			.className.match(/clockifyButtonId(\d+)/)[1];
		return id;
	}

	return null;
}

if (
	window.location.href.includes('chrome-extension://') ||
	window.location.href.includes('moz-extension://')
) {
	import('antd/lib/date-picker/style/css');
	import('antd/lib/switch/style/css');
	import('../sass/main.scss');
	checkConnection();
	window.mountHtmlElement = document.getElementById('mount');
	window.reactRoot = createRoot(window.mountHtmlElement);
	!navigator.onLine && window.reactRoot.render(<LoadingElement />);
	document.addEventListener('DOMContentLoaded', async () => {
		// since the navigator.onLine may be unreliable
		// once it says we are offline we need to give extension
		// some time to actually check if it's online or not by firing off a health check
		// api request
		const offlineDelay = navigator.onLine ? 0 : 500;
		setTimeout(() => {
			Mac();
			const application = new Application();

			localStorage.setItem('timeZone', moment.tz.guess());

			application.afterLoad();
		}, offlineDelay);
	});
} else {
	let integrationRoots = [];

	const renderClockifyButton = (props, buttonId) => {
		let counter = 0;
		if (buttonId === undefined || buttonId === null) {
			buttonId = getSiblingButtonId(props.popupProps?.origin) || 0;
		}
		const intervalId = setTimeout(() => {
			const documents = getAllDocuments();
			const [entryPoint] = documents
				.map(document => document.querySelector(`.clockifyButtonId${buttonId}`))
				.filter(Boolean);

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
								{...(props.popupProps?.manualMode || props.popupProps?.copyAsEntry
									? props.popupProps
									: {
											inProgressDescription:
												props.popupProps.inProgressDescription,
									  })}
								updateButtonProps={(btnProps, popupProps) =>
									window.updateButtonProperties(
										btnProps
											? { ...btnProps, buttonId: buttonId }
											: { buttonId },
										popupProps
									)
								}
								forceStart={args.forceStartTimer}
							/>
						</ErrorBoundary>
					);
				}

				function createReactRoot() {
					removeReactRoot();
					integrationRoots[buttonId] = createRoot(entryPoint, {
						identifierPrefix: buttonId,
					});
				}

				function addClickHandlerToHTMLButton() {
					const entryPointAlreadyHasClickListener = HTMLButtonsWithClickListener.find(
						element => entryPoint.isSameNode(element)
					);

					if (entryPointAlreadyHasClickListener) return;

					function clickHandler(e) {
						const isButtonReactApp = e.target.closest('#clockifyButtonReact');

						// React button has its own click handler
						// in ClockifyButton.js  file
						if (isButtonReactApp) return;

						e.preventDefault();
						e.stopPropagation();
						createReactRoot();
						renderToRoot({ forceStartTimer: true });
					}

					function removeStaleElements(array) {
						const HTMLButtonsWithClickListenerRefreshed = array.filter(
							({ isConnected }) => Boolean(isConnected)
						);

						HTMLButtonsWithClickListener = HTMLButtonsWithClickListenerRefreshed;
					}

					entryPoint.addEventListener('click', clickHandler, false);

					aBrowser.runtime.onMessage.addListener(request => {
						if (request.eventName === 'stopTimerWithShortcut') {
							clickHandler();
						}
					});
					HTMLButtonsWithClickListener.push(entryPoint);
					removeStaleElements(HTMLButtonsWithClickListener);
				}

				//helpers for creating HTML/React button
				function isFirstRender() {
					return (
						currBtnProps.newRoot &&
						!integrationRoots[buttonId] &&
						!props.popupProps?.manualMode &&
						!props.popupProps?.copyAsEntry
					);
				}

				function isUpdatedHTMLButton() {
					return (
						!currBtnProps.newRoot &&
						!integrationRoots[buttonId] &&
						!props.popupProps?.manualMode &&
						!props.popupProps?.copyAsEntry
					);
				}

				function removeReactRoot() {
					if (integrationRoots[buttonId]) {
						integrationRoots[buttonId].unmount();
						delete integrationRoots[buttonId];
					}
				}

				//if react mount point exists, render to it
				if (integrationRoots[buttonId]) {
					// if entry point is empty, it means that button was removed from DOM,
					// so we render HTML button again
					if (!entryPoint.firstChild) {
						// in some cases, when clockify button is in a modal, it doesn't get removed from DOM
						// when modal is closed, so we need to remove it manually
						removeReactRoot();
						createHTMLButton();
						addClickHandlerToHTMLButton();
					} else {
						addClickHandlerToHTMLButton();
						renderToRoot();
					}
				} else {
					if (isFirstRender()) {
						createHTMLButton();
						addClickHandlerToHTMLButton();
					} else if (isUpdatedHTMLButton()) {
						createHTMLButton();
					} else if (props.popupProps?.manualMode || props.popupProps?.copyAsEntry) {
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
				if (!('copyAsEntry' in newPopupProps)) {
					newPopupProps.copyAsEntry = false;
				}
				props.popupProps = { ...props.popupProps, ...newPopupProps };
			}
			renderClockifyButton(props, newBtnProps?.buttonId);
		};
	})();
}
