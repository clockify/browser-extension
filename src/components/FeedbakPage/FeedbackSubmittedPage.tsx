import * as React from 'react';
import HomePage from '../home-page.component';
import Header from '../header.component.jsx';
import locales from '../../helpers/locales';
import { isChrome } from '~/helpers/browser-helper';

function goBackToHomePage(): void {
	window.reactRoot.render(<HomePage />);
}

function FeedbackSubmittedPage(): React.JSX.Element {
	function handleLinkClicked(event) {
		event.preventDefault();

		if (isChrome()) {
			window.open('https://clockify.me/roadmap', '_blank');
		} else {
			aBrowser.tabs.create({ url: 'https://clockify.me/roadmap' });
		}
	}

	const checkerIcon = (
		<svg
			width="80"
			height="80"
			viewBox="0 0 80 80"
			fill="none"
			xmlns="http://www.w3.org/2000/svg">
			<g clipPath="url(#clip0_29547_9762)">
				<path
					d="M40 0C62.0914 0 80 17.9086 80 40C80 62.0914 62.0914 80 40 80C17.9086 80 0 62.0914 0 40C0 17.9086 17.9086 0 40 0ZM40 4C20.1177 4 4 20.1177 4 40C4 59.8823 20.1177 76 40 76C59.8823 76 76 59.8823 76 40C76 20.1177 59.8823 4 40 4ZM61.5996 28L34.7998 54.7998L20 40L22.7998 36.7998L34.7998 48.7998L58.7998 25.2002L61.5996 28Z"
					fill="#8BC34A"
				/>
			</g>
			<defs>
				<clipPath id="clip0_29547_9762">
					<rect width="80" height="80" fill="white" />
				</clipPath>
			</defs>
		</svg>
	);

	return (
		<div className="feedback-page-submitted">
			<div className="feedback_page__header">
				<Header showActions={false} backButton={true} goBackTo={goBackToHomePage} />
			</div>
			<div className="feedback-submitted-page__body">
				{checkerIcon}
				<h1 className="feedback-submitted-page__heading">
					{locales.FEEDBACK_SUBMITTED_TITLE}
				</h1>
				<p className="feedback-submitted-page__first-paragraph">
					{locales.FEEDBACK_SUBMITTED_SUBTITLE}
				</p>
				<p className="feedback-submitted-page__second-paragraph">
					{locales.FEEDBACK_SUBMITTED_UPDATES}{' '}
					<a
						className="feedback-submitted-page__second-paragraph-link"
						href="#"
						onClick={handleLinkClicked}>
						{locales.SUBMITTED_HERE_LINK}
					</a>
					.
				</p>
			</div>

			<div className="feedback-submitted-page__button-container">
				<button
					className="feedback-submitted-page__close-button"
					onClick={goBackToHomePage}>
					{locales.GLOBAL__CLOSE_BTN}
				</button>
			</div>
		</div>
	);
}

export default FeedbackSubmittedPage;
