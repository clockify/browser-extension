clockifyButton.render('div[role=dialog] .z2 .flex.border-darken2:not(.clockify)', {observe: true}, function (elem) {
    const cellContainerEl = $('div.detailView .labelCellPair .cellContainer');
    const description = () => {
        const desc = $('div[role="textbox"]', cellContainerEl)
        || $('textarea', cellContainerEl)
        || $('input', cellContainerEl);
        if(desc) {
            return desc.value || desc.innerText;
        }
    } 
    let link = clockifyButton.createButton({description});
    link.style.height = "45px"; // 60
    link.style.marginLeft = '8px';
    //elem.parentNode.appendChild(link);
    let emptySpaceEl = elem.querySelector('.flex-auto.flex.flex-column.justify-center');

    const inputForm = clockifyButton.createInput({
        description: description.value || description.innerText
    });

    inputForm.style.margin = '8px';
    
    emptySpaceEl.nextElementSibling.before(inputForm);
    emptySpaceEl.after(link);
});