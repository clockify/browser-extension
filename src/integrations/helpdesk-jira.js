setTimeout(() => {
	clockifyButton.render("#jira #issue-content .issue-header-content:not(.clockify)", {observe: true}, (elem) => {
		//console.log(elem);
		const toolbar = $(".command-bar .toolbar-split", elem);
		const project = $("#project-name-val", elem).innerText.trim();
		const task = $("#summary-val", elem).innerText.trim();
		const link = clockifyButton.createButton(task, project);
		link.setAttribute("class", "clockify-button-inactive");
		
		const buttonWrapper = document.createElement("div");
		buttonWrapper.setAttribute("class", "toolbar-trigger");
		buttonWrapper.appendChild(link);

		const liWrapper = document.createElement("li");
		liWrapper.setAttribute("class", "toolbar-item");
		liWrapper.appendChild(buttonWrapper);

		const ulWrapper = document.createElement("ul");
		ulWrapper.setAttribute("class", "toolbar-group");
		ulWrapper.appendChild(liWrapper);

		//console.log(ulWrapper);
		toolbar.appendChild(ulWrapper);
	});
}, 2000);
