import { IOnboardingSurveyOption } from '~/features/onboardingSurvey/types/onboardingSurveyOption.interface';

export interface IOnboardingSurvey {
	showSurvey: boolean;
	billingModelOptions: IOnboardingSurveyOption[];
	primaryGoalOptions: IOnboardingSurveyOption[];
	teamSizeOptions: IOnboardingSurveyOption[];
}
