// Card sidebar
clockifyButton.render(
	'.modal-card-details:not(.clockify)',
	{ observe: true },
	(modal) => {
		const modalNavbar = $('.modal-tabs .eve-navigation-bar');
		const cardId = text('span.card-id');
		const cardTitle = text('span.card-title');

		const description = () => `${cardId} ${cardTitle}`;
		const projectName = () => findProjectNameInCustomFields();
		const taskName = () => `${cardId} ${cardTitle}`;
		const tagNames = () => textList('.card-details-tags .eve-chip-text');

		const entry = { description, projectName, taskName, tagNames };

		const link = clockifyButton.createButton(entry);
		const input = clockifyButton.createInput(entry);

		container = createTag('div', 'clockify-widget-container');

		container.style.display = 'flex';
		container.style.alignItems = 'center';
		container.style.position = 'absolute';
		container.style.right = '40px';
		container.style.top = '18px';
		link.style.marginRight = '70px';

		container.append(link);
		container.append(input);

		modalNavbar.append(container);
	}
);

// Project should be content of custom field with name "Clockify Project" if exist
function findProjectNameInCustomFields() {
	const contentOfCustomFieldForPickingUp = 'Clockify Project';
	const findCustomFieldForPickingUp = (customField) =>
		text('.card-custom-field-name', customField) ===
		contentOfCustomFieldForPickingUp;

	const customFields = Array.from($$('.card-custom-field') || []);
	const customFieldForPickingUp = customFields.find(
		findCustomFieldForPickingUp
	);

	const projectName = customFieldForPickingUp
		? value('input', customFieldForPickingUp)
		: null;

	return projectName;
}
