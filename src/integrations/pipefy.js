clockifyButton.render('#edit-card-title:not(.clockify)', {observe: true}, (elem) => {
    let description = $('#edit-card-title');
    let link = clockifyButton.createButton(description.textContent);
    link.style.position = "relative";
    link.style.left = "15px";
    link.style.fontSize = "16px";
    elem.parentNode.appendChild(link);
});