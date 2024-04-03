// Details - v0.15.4-dev
clockifyButton.render(
	'.w-full .text-base:not(.clockify)',
	{ observe: true },
	async (elem) => {
		const description = () => elem.textContent + ': ' + $('*[placeholder="Issue title"]', elem.parentNode).textContent;
		const taskName = () => elem.textContent;
		const projectName = () => $('.line-clamp-1').textContent;
		const link = clockifyButton.createSmallButton({ description, taskName, projectName });
		link.style.marginLeft = '3px';
		link.style.bottom = '-2px';
		link.style.position = 'relative';
		elem.append(link);
	}
);
