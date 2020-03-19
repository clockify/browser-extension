clockifyButton.render('#channel_name:not(.clockify)', {observe: true}, () => {
    var link,
        placeholder = $('.channel_title_info'),
        description = $("#channel_name").textContent.trim(),
        project = $('#team_name').textContent;
    link = clockifyButton.createSmallButton(description);
    link.style.marginBottom = '8px';

    placeholder.parentNode.insertBefore(link, placeholder);
});