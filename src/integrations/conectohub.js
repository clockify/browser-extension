// Projects - opened project modal
clockifyButton.render(
	'.task-actions-list:not(.clockify)',
	{ observe: true, onNavigationRerender: true },
	elem => {
		observeModalState();

		const projectName = () => text('.long-text-project-box');
		const description = () => value('.task-name-input.long-text');

		const button = clockifyButton.createSmallButton({ description, projectName });

		button.style.marginRight = '15px';

		elem.prepend(button);
	}
);

function observeModalState() {
	const observationTarget = document.querySelector('.ant-drawer.ant-drawer-right');
	const modalObserver = new MutationObserver(() => checkModalStateAndRerender(observationTarget));

	modalObserver.observe(observationTarget, { attributes: true, attributeFilter: ['class'] });
}

function checkModalStateAndRerender(observationTarget) {
	if (observationTarget.classList.contains('ant-drawer-open')) {
		clockifyButton.rerenderAllButtons();
	}
}
