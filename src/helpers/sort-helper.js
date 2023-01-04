export class SortHepler {
	constructor() {}

	sortArrayByStringProperty(array, prop) {
		return array.sort((a, b) =>
			a[prop].toLowerCase() > b[prop].toLowerCase()
				? 1
				: b[prop].toLowerCase() > a[prop].toLowerCase()
				? -1
				: 0
		);
	}
}
