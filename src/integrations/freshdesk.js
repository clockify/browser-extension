clockifyButton.render('.page-actions__left:not(.clockify)', { observe: true }, function () {
        createClockifyElements();
});


function createClockifyElements(){
        const containerElem = $(".page-actions__left");
        const clockifyButtonElement = $("#clockifyButton");
        if (clockifyButtonElement) clockifyButtonElement.remove();
        const desc = $(".ticket-subject-heading").innerText;
        const ticket = $(".breadcrumb__item.active").innerText;
        const link = clockifyButton.createButton("[#" + ticket + "] " + desc);
        link.style.marginLeft = "10px";
        link.style.display = "inline-flex";
        link.style.verticalAlign = "middle";
        containerElem.append(link);
}

//when item is changed on page, then create clockify button with new data
setTimeout(() => {
  createClockifyElements();
}, 600)