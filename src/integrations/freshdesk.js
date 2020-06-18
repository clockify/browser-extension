clockifyButton.render('.page-actions__left:not(.clockify)', { observe: true }, function (elem) {
        const desc = $(".ticket-subject-heading").innerText;
        const ticket = $(".breadcrumb__item.active").innerText;
        const link = clockifyButton.createButton("[#" + ticket + "] " + desc);
        link.style.marginLeft = "10px";
        elem.append(link);
});
