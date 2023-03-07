import { de, enUS, es, fr, ja, ko, pt, ru } from 'date-fns/locale';

import { registerLocale } from 'react-datepicker';

var dateFnsLocale = {
	regLocale: async () => {
		const lang = await localStorage.getItem('lang');
		switch (lang) {
			case 'en':
				registerLocale('en', enUS);
				break;
			case 'fr':
				registerLocale('fr', fr);
				break;
			case 'de':
				registerLocale('de', de);
				break;
			case 'es':
				registerLocale('es', es);
				break;
			case 'pt':
				registerLocale('pt', pt);
				break;
			case 'ru':
				registerLocale('ru', ru);
				break;
			case 'ko':
				registerLocale('ko', ko);
				break;
			case 'ja':
				registerLocale('ja', ja);
				break;
			default:
				registerLocale('en', enUS);
				break;
		}
	},

	getLocale: async () => {
		const lang = await localStorage.getItem('lang');
		switch (lang) {
			case 'en':
				return enUS.localize;
			case 'fr':
				return fr.localize;
			case 'de':
				return de.localize;
			case 'es':
				return es.localize;
			case 'pt':
				return pt.localize;
			case 'ru':
				return ru.localize;
			case 'ko':
				return ko.localize;
			case 'ja':
				return ja.localize;
			default:
				return enUS.localize;
		}
	},

	async getDaysShort() {
		const loc = await this.getLocale();
		const days = [];
		for (let i = 0; i <= 6; i++) {
			days.push(loc.day(i, { width: 'short' }));
		}
		return days;
	},

	async getDayShort(num) {
		const loc = await this.getLocale();
		return loc.day(num, { width: 'short' });
	},

	async getDuration(hours, minutes) {
		const loc = await this.getLocale();
		return loc.formatDuration({ hours, minutes });
	},
};

export default dateFnsLocale;
