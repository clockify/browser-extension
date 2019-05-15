clockifyButton.render('.flexible-header:not(.clockify)', {observe: true}, (elem) => {
    let description = document.title.replace("monday - ", "");
    let link = clockifyButton.createButton(description);
    link.style.position = "absolute";
    link.style.top = "5px";
    link.style.right = "5px";
    elem.parentNode.appendChild(link);
});
