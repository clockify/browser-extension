const observer = new MutationObserver((mutations) => {
	mutations.forEach((mutation) => {
		if (mutation.type === 'characterData') {
			renderCardButton();
		}
	});
});

setTimeout(() => {
	let target = $('.ticket-subject-heading');
	console.log('title', target);
	const config = { characterData: true, attributes: true, childList: true, subtree: true };

	observer.observe($('.ticket-subject-heading'), config);

	target = $('.breadcrumb__item.active');
	console.log('number', target);
	observer.observe($('.breadcrumb__item.active'), config);
	}, 3000);	


function renderCardButton(){
	removeAllButtons();
	clockifyButton.render(
		'.page-actions__left:not(.clockify)',
		{ observe: true },
		(elem) => {
			if ($('#clockifyButton')) return;

			const ticketSubject = () => $('.ticket-subject-heading').innerText;
			const ticketNumber = () => $('.breadcrumb__item.active').innerText;

			const description = () => `[#${ticketNumber()}] ${ticketSubject()}`;

			const link = clockifyButton.createButton({ description });

			link.style.marginLeft = '10px';
			link.style.display = 'inline-flex';
			link.style.verticalAlign = 'middle';

			elem.append(link);
		}
	);
}

renderCardButton();



