clockifyButton.render('.case:not(.clockify)', { observe: true }, (elem) => {
	var link,
		description = $('h1', elem).textContent,
		clockifyDiv = createTag('div', 'clockify-container'),
		appendTo = $('.controls');

	link = clockifyButton.createButton(description);
	link.style.position = 'relative';
	link.style.top = '0px';
	link.style.left = '15px';
	clockifyDiv.appendChild(link);
	appendTo.parentNode.insertBefore(clockifyDiv, appendTo);
});
