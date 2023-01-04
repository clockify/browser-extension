
clockifyButton.render(
	'.V9yOa:not(.clockify)',
	{ observe: true },
	(elem) => {
		var div,
			link,
			container = $('._36nYd._1fgLh', elem);
			container.style.height = '190px';
			description = $('.jVE-0', elem).textContent;

		link = clockifyButton.createButton(description);
		link.style.height = '36px';
		link.style.marginBottom = '8px';
		link.style.border = '1px solid #e6ecf0';
		link.style.borderRadius = '10px';
		link.style.width = '50%';
		link.style.marginRight = '4px';
		link.style.marginLeft = '2px';

		input = clockifyButton.createInput({description: description});
		input.style.marginRight = '12px';
		input.style.height = '36px';
		input.style.marginBottom = '8px';
		input.style.border = '1px solid #e6ecf0';
		input.style.borderRadius = '10px';
		input.style.width = '50%';
		input.style.textAlign = 'center';
		input.style.paddingTop = '2px';
		input.style.marginRight = '2px';
		input.style.marginLeft = '4px';

		div = document.createElement('div');
		div.style.display = 'flex';
		div.style.justifyContent = "space-between";

		div.appendChild(link);
		div.appendChild(input);
		container.appendChild(div);
	}
);


