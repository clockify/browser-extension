clockifyButton.render('.group-detail:not(.clockify)', { observe: true }, () => {
	if ($('#clockifyButton')) return;

	const issueNameWithNumber = $(
		'.group-detail .auto-select-text > span'
	).textContent;

	const issueNumber = issueNameWithNumber.split('-').slice(-1).join(' ');

	const detailTitle = (
			$('h3 > span') ||
			$('.ez9r7o64') ||
			$('.app-1t4tomo') ||
			$('.e1v8ok1u0')
		).innerHTML
			.split('<')[0]
			.trim(),
		detailDescription = $('.app-1h2hd63').textContent.trim();

	const projectName = issueNameWithNumber
		.split('-')
		.slice(0, -1)
		.join(' ')
		.trim();
	const description = `#${issueNumber}: ${detailTitle}-${detailDescription}`;
	const link = clockifyButton.createButton({ description, projectName });

	link.style.marginTop = '-5px';

	$('.group-detail [role="tablist"]').appendChild(link);
});
