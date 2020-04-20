function startStop(e){
	e.detail.click();
}

setTimeout(() => {
		console.log(clockifyButton);
	
        // clockifyButton.render('.container #question-header:not(.clockify)', {observe: true}, (elem) => {
		// 	console.log(elem.childNodes[1].childNodes[0].innerText);
		// 	const title = elem.childNodes[1].childNodes[0].innerText;
			
		// 	const link = clockifyButton.createButton(title);
		// 	console.log(link);
			
		// 	const customEvent = new CustomEvent("startstop", {detail: link});
			
		// 	link.addEventListener("startstop", startStop);
			
		// 	link.dispatchEvent(customEvent);
			
		// 	window.addEventListener('unload', event => {
		// 		console.log(link);
		// 		console.log("unloaded");
		// 		window.addEventListener("startstop", startStop);
		// 		window.dispatchEvent(customEvent);
		// 	});
		// });
}, 3000);

