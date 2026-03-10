clockifyButton.render(
	'.taskCell.tc_title.editable:not(.clockify)',
	{ observe: true },
	taskNameElement => {
		if ($('.clockifyButton', taskNameElement.parentElement)) return;

		const folderName = () => text('[class="taskCell editable"]', taskNameElement.parentElement);
		const taskName = () => taskNameElement.textContent?.trim() || text('[class="taskCell tc_title editable completed"]');

		const description = () => `${taskName()}${folderName() ? ` - ${folderName()}` : ''}`;

		const button = clockifyButton.createSmallButton({ description });

		taskNameElement.parentElement.style.display = 'flex';
		taskNameElement.parentElement.style.alignItems = 'center';
		button.style.marginRight = '5px';

		taskNameElement.insertAdjacentElement('beforebegin', button);
	},
);

