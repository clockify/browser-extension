clockifyButton.render('div[role=dialog] .z2 .flex.border-darken2:not(.clockify)', {observe: true}, function (elem) {
    const cellContainerEl = $('div.detailView .labelCellPair .cellContainer');
    let description =  $('div[role="textbox"]', cellContainerEl)
                   || $('textarea', cellContainerEl)
                   || $('input', cellContainerEl);
    let link = clockifyButton.createButton({description: description.value || description.innerText, observeTitle: description});
    link.style.height = "45px"; // 60
    link.style.marginLeft = '8px';
    //elem.parentNode.appendChild(link);
    let emptySpaceEl = elem.querySelector('.flex-auto.flex.flex-column.justify-center');

    emptySpaceEl.after(link);
});