// Microsot Planner, task card view
clockifyButton.render('.taskCard:not(.clockify)', { observe: true }, taskCard => {
	const description = () => text('.title', taskCard);
	const projectName = () => text('.primaryTextSectionTitle');
	const tagNames = () => textList('.labelTag > span', taskCard);

	const entry = { description, projectName, tagNames, small: true };

	const timer = clockifyButton.createButton(entry);

	const bottomSection = $('.leftSection', taskCard);

	bottomSection.after(timer);
});
