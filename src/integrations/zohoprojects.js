setTimeout(() => {
    clockifyButton.render('.detail-quick-link:not(.clockify)', { observe: true }, function (elem) {
        const taskName = $(".detail-title-plain").innerText;
        const projectTitle = $(".detail-updates i.zoho-projects").innerText;

        const link = clockifyButton.createButton({
            description: taskName,
            projectName: projectTitle,
            small: false
        });
        elem.append(link);

    });
}, 1000);
