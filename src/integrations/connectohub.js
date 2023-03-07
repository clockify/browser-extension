if (!window.clockify) {
	window.clockify = { buttons: [], inputs: [] };
}

window.addEventListener('createClockifyButton', (e) => {
	const task = e.detail;

	const wrapper = document.querySelector(task.wrapper);
	if (!wrapper) {
		return;
	}

	if (window.clockify.buttons[task.wrapper]) {
		window.clockify.buttons[task.wrapper].remove();
	}
	const button = clockifyButton.createButton(task);
	button.classList.add('clockify-button');
	window.clockify.buttons[task.wrapper] = button;
	wrapper.prepend(button);

	if (window.clockify.inputs[task.wrapper]) {
		window.clockify.inputs[task.wrapper].remove();
	}
	const input = clockifyButton.createInput(task);
	window.clockify.inputs[task.wrapper] = input;
	wrapper.append(input);
});
