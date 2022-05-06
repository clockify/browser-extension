//Original Zoho Desk UI - places the start/stop timer button just under the Due Date in the Ticket Information Panel
clockifyButton.render('.lhs-ticket-dtls:not(.clockify)', { observe: true }, function (elem) {
    const desc = $("#caseSubjectText").innerText;
    const ticket = $("#caseNum").innerText;
    const link = clockifyButton.createButton("[#" + ticket + "##] " + desc);    
    elem.append(link);
});

//Newer Next Gen UI - places the start/stop timer in the ticket title bar after the ticket creation time.
clockifyButton.render('.zd-dvsubjectsection-timerWrapper:not(.clockify)', { observe: true }, function (elem) {
    const desc = $(".zd-dvsubjectsection-subject").innerText;
    const ticket = $(".zd-ticketsubject-ticketId").innerText;
    const link = clockifyButton.createButton("[#" + ticket + "##] " + desc);
  link.style.display = "block";
  link.style.paddingTop = "0";
  link.style.paddingBottom = "0";
  link.style.paddingLeft = "10px";
  link.style.marginBottom = "0";
  link.style.cursor = 'pointer';    
  elem.append(link);
});