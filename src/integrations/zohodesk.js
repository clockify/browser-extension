clockifyButton.render('.lhs-ticket-dtls:not(.clockify)', { observe: true }, function (elem) {
    const desc = $("#caseSubjectText").innerText;
    const ticket = $("#caseNum").innerText;
    const link = clockifyButton.createButton("[#" + ticket + " ##] " + desc);    
    elem.append(link);
});