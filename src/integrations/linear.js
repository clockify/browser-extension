console.log('Adding Clockify integration to Linear!....');
clockifyButton.render('[aria-label="Edit issue"]:not(.clockify)', {observe: true}, function (elem) {
    const pathArray = window.location.pathname.split('/');
    console.log(pathArray);
});
