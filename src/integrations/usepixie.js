(function () {
	function ready(callbackFunc) {
		if (document.readyState == 'complete') {
			callbackFunc();
		} else {
			document.addEventListener('load', callbackFunc);
		}
	}

	function getTaskName() {
		if ($('.c-header__jobtitle') != null) {
			return $('.c-header__jobtitle').textContent.trim();
		}

		return $('.editable-task-container input').value.trim();
	}

	function getClientName() {
		if ($('#client-editor .has-selected .px-select-label') != null) {
			// task html
			return $(
				'#client-editor .has-selected .px-select-label'
			).textContent.trim();
		} else if (
			$('.c-header--context__section--client .client-name p') != null
		) {
			// task vuejs component
			return $(
				'.c-header--context__section--client .client-name p'
			).textContent.trim();
		} else {
			// client page
			return $(
				'.c-header .o-media .o-media__body .c-heading-3'
			).textContent.trim();
		}
	}

	function taskElementsReady() {
		var clientLoaded =
			$('#client-editor .has-selected .px-select-label') != null ||
			$('.c-header--context__section--client .client-name p') != null;
		var taskLoaded =
			$('.c-header__jobtitle') != null ||
			$('.editable-task-container input') != null;

		return clientLoaded && taskLoaded;
	}

	function insertButtonForTask() {
		clockifyButton.renderTo(
			'#job-details-header .c-toolbar-container:not(.clockify)',
			(elem) => {
				var taskName = getTaskName(),
					clientName = getClientName(),
					link = clockifyButton.createButton({
						description: `${clientName} - ${taskName}`,
						projectName: clientName,
						taskName: taskName,
						billable: true,
					});

				insertButton(link);
			}
		);
	}

	function insertButtonForClient() {
		clockifyButton.renderTo('.c-toolbar-container:not(.clockify)', (elem) => {
			var clientName = getClientName(),
				link = clockifyButton.createButton({
					description: clientName,
					projectName: clientName,
					taskName: null,
					billable: true,
				});

			insertButton(link);
		});
	}

	function insertButton(button) {
		var container = $('.c-header > .c-header__section:nth-child(3)'),
			plusBtn = $('.c-dropdown-container:nth-child(1)');

		button.classList.add(
			'c-button',
			'c-button--outline',
			'c-button--neutral',
			'c-button--small',
			'u-mr-small'
		);
		button.dataset.flitem = 'shy-left--';
		plusBtn.dataset.flitem = '';
		container.insertBefore(button, plusBtn);
	}

	function viewingTaskDetailsPage() {
		return document.getElementById('job-details-header') != null;
	}

	function viewingClientDetailsPage() {
		return location.pathname.startsWith('/clients/');
	}

	function loadTaskButton() {
		if (!taskElementsReady()) {
			setTimeout(loadTaskButton, 100);
			return;
		}

		insertButtonForTask();
	}

	ready(() => {
		if (viewingClientDetailsPage()) {
			insertButtonForClient();
		} else if (viewingTaskDetailsPage()) {
			loadTaskButton();
		}
	});
})();
