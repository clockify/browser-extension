clockifyButton.render('.flexible-header:not(.clockify)', {observe: true}, function (elem) {
    project = $("#board-header > div.board-header-content-wrapper > div.board-header-main > div.board-header-top > div.board-header-left > div > div.ds-editable-component > div > span").textContent;
	description = $(".multiline-ellipsis-component").textContent;
    link = clockifyButton.createButton(description, project);
    link.style.position = "absolute";
    link.style.top = "5px";
    link.style.right = "5px";
    elem.appendChild(link);
});


