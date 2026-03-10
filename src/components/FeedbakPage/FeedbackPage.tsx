import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import Modal from 'react-modal';
import Toaster from '../toaster-component';
import HomePage from '../home-page.component';
import FeedbackSubmittedPage from './FeedbackSubmittedPage';
import Header from '../header.component.jsx';
import SingleSelectDropdown from './SingleSelectDropdown';
import Checkbox from '../Checkbox';
import locales from '../../helpers/locales';
import { getBrowser } from '~/helpers/browser-helper';

type errors = { [key: string]: boolean };
type key = { label: string; localizationKey: string };

interface FeedbackPageProps {
	categoryOptions: key[];
	platformOptions: key[];
}

function goBackToHomePage(): void {
	window.reactRoot.render(<HomePage />);
}

function FeedbackPage(props: FeedbackPageProps): React.JSX.Element {
	const { platformOptions, categoryOptions } = props;

	const defaultPlatform = platformOptions.find(({ localizationKey }) =>
		localizationKey.includes('browser.extension')
	);

	const initialFieldValues = {
		platform: defaultPlatform,
		category: { label: '', localizationKey: '' },
		feedback: '',
		productResearch: false,
	};

	const initialFieldErrors = {
		isPlatformUnselected: false,
		isCategoryUnselected: false,
		isMessageUnpopulated: false,
	};

	const [values, setValues] = useState(initialFieldValues);
	const [errors, setErrors] = useState(initialFieldErrors);
	const [platforms, setPlatforms] = useState(platformOptions);
	const [categories, setCategories] = useState(categoryOptions);
	const [isDiscardFeedbackModalOpened, setIsDiscardFeedbackModalOpened] = useState(false);
	const [isOnline, setIsOnline] = useState(navigator.onLine);

	const toasterRef = useRef(null);

	useEffect(() => {
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	}, []);

	useEffect(() => {
		(async () => {
			setPlatforms(platformOptions);
			setCategories(categoryOptions);

			const draft = await localStorage.getItem('feedbackFormDraft');

			const platformDraft = platformOptions.find(
				({ localizationKey }) => localizationKey === draft.platform?.localizationKey
			);
			const categoryDraft = categoryOptions.find(
				({ localizationKey }) => localizationKey === draft.category?.localizationKey
			);

			setValues({
				platform: platformDraft || initialFieldValues.platform,
				category: categoryDraft || initialFieldValues.category,
				feedback: draft.feedback || initialFieldValues.feedback,
				productResearch: draft.productResearch || initialFieldValues.productResearch,
			});
		})();
	}, []);

	useEffect(() => {
		detachErrorsFromSetRequiredFields();
	}, [values]);

	function attachErrorsOnUnsetRequiredFields() {
		const errorAccumulator: errors = {};

		if (!Boolean(values.platform.localizationKey)) {
			errorAccumulator.isPlatformUnselected = true;
		}

		if (!Boolean(values.category.localizationKey)) {
			errorAccumulator.isCategoryUnselected = true;
		}

		if (!Boolean(values.feedback)) {
			errorAccumulator.isMessageUnpopulated = true;
		}

		setErrors({ ...errors, ...errorAccumulator });
	}

	function detachErrorsFromSetRequiredFields() {
		const errorAccumulator: errors = {};

		if (Boolean(values.platform.localizationKey)) {
			errorAccumulator.isPlatformUnselected = false;
		}

		if (Boolean(values.category.localizationKey)) {
			errorAccumulator.isCategoryUnselected = false;
		}

		if (Boolean(values.feedback)) {
			errorAccumulator.isMessageUnpopulated = false;
		}

		setErrors({ ...errors, ...errorAccumulator });
	}

	async function updatePlatform({ label, localizationKey }: key) {
		const updatedValues = { ...values, platform: { label, localizationKey } };

		setValues(updatedValues);

		await localStorage.setItem('feedbackFormDraft', updatedValues);
	}

	async function updateCategory({ label, localizationKey }: key) {
		const updatedValues = { ...values, category: { label, localizationKey } };

		await localStorage.setItem('feedbackFormDraft', updatedValues);

		setValues(updatedValues);
	}

	async function updateFeedback(feedback: string) {
		const updatedValues = { ...values, feedback: feedback.trimStart() };

		await localStorage.setItem('feedbackFormDraft', updatedValues);

		setValues(updatedValues);
	}

	async function updateCheckbox(productResearch: boolean) {
		const updatedValues = { ...values, productResearch };

		await localStorage.setItem('feedbackFormDraft', updatedValues);

		setValues(updatedValues);
	}

	function openModalIfAnyFieldIsChanged() {
		if (hasAnyFieldNonInitialValue()) {
			setIsDiscardFeedbackModalOpened(!isDiscardFeedbackModalOpened);
		} else {
			goBackToHomePage();
		}
	}

	function hasAnyFieldNonInitialValue() {
		return JSON.stringify(values) !== JSON.stringify(initialFieldValues);
	}

	async function handleFormSubmit({ target }) {
		if (JSON.parse(await localStorage.getItem('offline'))) {
			target.title = "Can't submit while offline";
			return;
		}

		if (!isEachRequiredFieldFilled()) {
			attachErrorsOnUnsetRequiredFields();

			return;
		}

		const { sendMessage } = getBrowser().runtime;
		const eventName = 'makeFeedback';
		const body = {
			categoryLocalizationKey: values.category.localizationKey,
			platformLocalizationKey: values.platform.localizationKey,
			feedback: values.feedback,
			productResearch: values.productResearch,
		};

		const response = await sendMessage({ eventName, options: body });

		if (!response.error) {
			await clearValues();

			window.reactRoot.render(<FeedbackSubmittedPage />);
		} else if (response.error.status === 429) {
			showErrorToast(locales.TOO_MANY_REQUESTS);
		}
	}

	function isEachRequiredFieldFilled() {
		const hasPlatformValue = Boolean(values.platform.localizationKey);
		const hasCategoryValue = Boolean(values.category.localizationKey);
		const hasMessageValue = Boolean(values.feedback.trim());

		return hasPlatformValue && hasCategoryValue && hasMessageValue;
	}

	async function clearValues() {
		setValues(initialFieldValues);

		await localStorage.setItem('feedbackFormDraft', initialFieldValues);
	}

	const showErrorToast = (message: string): void => toasterRef.current.toast('error', message, 3);

	const requiredFieldParagraph = (
		<p className="required-field-message">{locales.FIELD_REQUIRED_VALIDATION}</p>
	);

	return (
		<div className="feedback-page">
			<Modal
				className="feedback-page-modal"
				style={{
					overlay: {
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: 'rgba(0, 0, 0, 0.87)',
						zIndex: '2147483646',
						outline: 'none',
					},
					content: {
						position: 'absolute',
						top: '35.55%',
						left: '5%',
						right: '5%',
						bottom: '35.55%',
						borderRadius: '2px',
						background: '#fff',
						overflow: 'auto',
						WebkitOverflowScrolling: 'touch',
						outline: 'none',
					},
				}}
				isOpen={isDiscardFeedbackModalOpened}>
				<div className="feedback-page__modal-header">
					<h1>{locales.DISCARD_FEEDBACK_TITLE}</h1>
				</div>
				<div className="feedback-page__modal-body">
					<p>{locales.DISCARD_FEEDBACK_TEXT}</p>
				</div>
				<div className="feedback-page__modal-footer">
					<button
						className="feedback-page__modal-cancel-button"
						style={{ textTransform: 'none' }}
						onClick={() => setIsDiscardFeedbackModalOpened(false)}>
						{locales.DISCARD_FEEDBACK_BUTTON}
					</button>
					<button
						className="feedback-page__modal-discard-button"
						onClick={async () => {
							await clearValues();
							goBackToHomePage();
						}}>
						{locales.DISCARD}
					</button>
				</div>
			</Modal>
			<div className="feedback_page__header">
				<Header
					showActions={false}
					backButton={true}
					goBackTo={openModalIfAnyFieldIsChanged}
					isOffline={!isOnline}
				/>
			</div>
			<main>
				<p className="pale_text">{locales.FEEDBACK_FORM_PARAGRAPH}</p>
				<SingleSelectDropdown
					items={platforms}
					label={locales.FEEDBACK_FORM_PLATFORM}
					error={errors.isPlatformUnselected}
					labelProps={{ required: true }}
					updateValue={updatePlatform}
					selectedValue={values.platform}
					defaultValue={defaultPlatform}
					dropdownClassList={'platform'}
				/>
				<SingleSelectDropdown
					items={categories}
					label={locales.CATEGORY}
					error={errors.isCategoryUnselected}
					labelProps={{ required: true }}
					updateValue={updateCategory}
					selectedValue={values.category}
					dropdownClassList={'category'}
				/>
				<div className="message_container">
					<label>{locales.FEEDBACK_FORM_MESSAGE}</label>
					<textarea
						required
						maxLength={4000}
						value={values.feedback}
						onChange={event => updateFeedback(event.target.value)}
						placeholder={locales.FEEDBACK_FORM_MESSAGE_PLACEHOLDER}
					/>
					{errors.isMessageUnpopulated && requiredFieldParagraph}
				</div>
				<Checkbox
					label={locales.FEEDBACK_FORM_PARTICIPATION}
					classList="participation_container"
					isChecked={values.productResearch}
					setIsChecked={updateCheckbox}
				/>
			</main>
			<div className="feedback_page__button-container">
				<button className="feedback_cancel_button" onClick={openModalIfAnyFieldIsChanged}>
					{locales.CANCEL}
				</button>
				<button className="feedback_submit_button" onClick={handleFormSubmit}>
					{locales.SUBMIT}
				</button>
			</div>
			<Toaster ref={instance => (toasterRef.current = instance)} />
		</div>
	);
}

export default FeedbackPage;
