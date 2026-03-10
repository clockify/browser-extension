class FeedbackService extends ClockifyService {
	static async getFeedbackLocalizationKeys() {
		const baseUrl = await this.apiEndpoint;
		const url = `${baseUrl}/feedback`;

		return this.apiCall(url);
	}
	static async makeFeedback(body) {
		const baseUrl = await this.apiWriteEndpoint();
		const url = `${baseUrl}/feedback`;

		return this.apiCall(url, 'POST', body);
	}
}
