import React, { useEffect, useRef, useState } from 'react';
import { OnboardingSurveySection } from '~/features/onboardingSurvey/components/OnboardingSurveySection';
import locales from '~/helpers/locales';
import { IOnboardingSurveyOption } from '~/features/onboardingSurvey/types/onboardingSurveyOption.interface';
import { getBrowser } from '~/helpers/browser-helper';
import { onClickOutside } from '~/helpers/onClickOutside';

export const OnboardingSurvey = props => {
	const [canSubmit, setCanSubmit] = useState(false);
	const [showError, setShowError] = useState(false);
	const [shouldShowSurvey, setShouldShowSurvey] = useState(false);
	const [surveyForm, setSurveyForm] = useState({
		billingModelLocalizationKey: '',
		primaryGoalLocalizationKey: '',
		teamSizeLocalizationKey: '',
	});
	const [primaryGoalOptions, setPrimaryGoalOptions] = useState<IOnboardingSurveyOption[]>([]);
	const [teamSizeOptions, setTeamSizeOptions] = useState<IOnboardingSurveyOption[]>([]);
	const [billingModelOptions, setBillingModelOptions] = useState<IOnboardingSurveyOption[]>([]);

	const errorRef = useRef();

	onClickOutside(errorRef, () => setShowError(false));

	useEffect(() => {
		getOnboardingSurveyInfo();

		const workspaceChangedAction = (changes, areaName) => {
			if (areaName === 'local' && changes.activeWorkspaceId) {
				getOnboardingSurveyInfo();
			}
		};

		getBrowser().storage.onChanged.addListener(workspaceChangedAction);

		return () => {
			getBrowser().storage.onChanged.removeListener(workspaceChangedAction);
		};
	}, []);

	useEffect(() => {
		setCanSubmit(validateSurvey());
	}, [surveyForm]);

	const getOnboardingSurveyInfo = () => {
		getBrowser()
			.runtime.sendMessage({
				eventName: 'getOnboardingSurvey',
			})
			.then(res => {
				if (!res.data) return;

				setShouldShowSurvey(res.data.showSurvey);

				if (res.data.showSurvey) {
					setPrimaryGoalOptions(res.data.primaryGoalOptions);
					setTeamSizeOptions(res.data.teamSizeOptions);
					setBillingModelOptions(res.data.billingModelOptions);
				}
			});
	};

	const validateSurvey = () => {
		return Object.values(surveyForm).every(Boolean);
	};

	const submitSurvey = () => {
		if (canSubmit) {
			getBrowser()
				.runtime.sendMessage({
					eventName: 'submitOnboardingSurvey',
					options: surveyForm,
				})
				.then(response => {
					if (response?.error) {
						props.showMessage(response.error.message, 4);
					}
					setShouldShowSurvey(false);
				});
			return;
		}

		setShowError(state => !state);
	};

	return shouldShowSurvey ? (
		<div className={'onboarding-survey'}>
			<div className={'onboarding-survey-title'}>
				<img src={'assets/images/64x64.png'} alt={''} />
				<span>{locales.ONBOARDING_SURVEY__TITLE}</span>
			</div>

			<div className={'onboarding-survey-content'}>
				<div className={'onboarding-survey-content-sections'}>
					<OnboardingSurveySection
						options={primaryGoalOptions}
						label={locales.ONBOARDING_SURVEY__PART_1}
						defaultOptionLabel={locales.ONBOARDING_SURVEY__GOAL_PLACEHOLDER}
						onSelect={(value: string) =>
							setSurveyForm(state => ({
								...state,
								primaryGoalLocalizationKey: value,
							}))
						}
					/>

					<OnboardingSurveySection
						options={teamSizeOptions}
						label={locales.ONBOARDING_SURVEY__PART_2}
						defaultOptionLabel={locales.ONBOARDING_SURVEY__SIZE_PLACEHOLDER}
						onSelect={(value: string) =>
							setSurveyForm(state => ({
								...state,
								teamSizeLocalizationKey: value,
							}))
						}
					/>

					<OnboardingSurveySection
						dropdownDirection={'top'}
						options={billingModelOptions}
						label={locales.ONBOARDING_SURVEY__PART_3}
						defaultOptionLabel={locales.ONBOARDING_SURVEY__MODEL_PLACEHOLDER}
						onSelect={(value: string) =>
							setSurveyForm(state => ({
								...state,
								billingModelLocalizationKey: value,
							}))
						}
					/>
				</div>

				<div className={'onboarding-survey-content-action'} ref={errorRef}>
					<button onClick={submitSurvey}>
						{locales.ONBOARDING_SURVEY__START_USING_BUTTON}
					</button>

					{showError && (
						<div className="error-popover">
							<div className="arrow"></div>
							{locales.ONBOARDING_SURVEY__VALIDATION_POPOVER}
						</div>
					)}
				</div>
			</div>
		</div>
	) : null;
};
