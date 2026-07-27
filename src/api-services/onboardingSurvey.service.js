class OnboardingSurveyService extends ClockifyService {
	static async getOnboardingSurvey() {
		const baseUrl = await this.apiEndpoint;
		const wsId = await localStorage.getItem('activeWorkspaceId');

		return this.apiCall(`${baseUrl}/workspaces/${wsId}/short-survey`);
	}

	static async submitOnboardingSurvey(surveyAnswers) {
		const baseUrl = await this.apiEndpoint;
		const wsId = await localStorage.getItem('activeWorkspaceId');

		return this.apiCall(`${baseUrl}/workspaces/${wsId}/short-survey`, 'POST', surveyAnswers);
	}
}
