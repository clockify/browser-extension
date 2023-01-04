// For a Maniphest task on a project workboard
clockifyButton.render(
	'.phui-workcard:not(.clockify)',
	{ observe: true },
	(elem) => {
		var description =
			$('.phui-oi-objname', elem).textContent +
			': ' +
			$('.phui-oi-link', elem).textContent.trim();
		var link = clockifyButton.createSmallButton(description);
		link.style.marginRight = '5px';
		$('.phui-oi-name', elem).prepend(link);
	}
);

// For a Maniphest task details page
clockifyButton.render(
	'.phui-header-view:not(.clockify)',
	{ observe: true },
	(elem) => {
		var task_number = document.URL.split('/').pop();
		// test if it is a task details page
		if (!/^(T[0-9]+)$/.test(task_number)) {
			return;
		}
		var description =
			task_number + ': ' + $('.phui-header-header').textContent.trim();
		var link = clockifyButton.createButton(description);
		$('.phui-header-subheader', elem).append(link);
	}
);

// For a Maniphest task on dashboards
clockifyButton.render(
	'.phui-oi-content-box:not(.clockify)',
	{ observe: true },
	(elem) => {
		var task_anchor = $('.phui-oi-link', elem);
		var task_number = task_anchor.href.split('/').pop();
		// test if it is a task element
		if (
			!/^(T[0-9]+)$/.test(task_number) ||
			document.URL.includes('/project/') ||
			document.URL.includes('/tag/')
		) {
			return;
		}
		var description = task_number + ': ' + task_anchor.textContent.trim();
		var link = clockifyButton.createButton(description);
		$('.phui-oi-attributes', elem).append(link);
	}
);
