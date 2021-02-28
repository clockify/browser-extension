// Ticket detail - https://*.freshservice.com/helpdesk/tickets/{ID}
clockifyButton.render(
    "#sticky_header.tkt-details-sticky .sticky_right:not(.clockify)",
    { observe: true },
    function (elem) {
        const desc = $("#ticket_original_request_section .subject").innerText;
        const ticket = $(".ticket_header span").innerText;
        const link = clockifyButton.createButton("[" + ticket + "] " + desc);
        link.style.marginRight = "12px";
        link.style.marginLeft = "10px";
        link.style.marginTop = "5px";
        var container = document.createElement("div");
        container.className = "ticket-actions";
        container.prepend(link);
        const placeholder = elem.querySelector(".ticket-actions");
        if (placeholder) {
            placeholder.insertAdjacentElement("afterEnd", container);
        } else {
            elem.append(container);
        }
    }
);

// Customer-facing ticket view - https://*.freshservice.com/support/tickets/{ID}
clockifyButton.render(
    "#ticket-sidebar:not(.clockify)",
    { observe: true },
    function (elem) {
        const desc = $("#ticket-show h2.heading>span").innerText;
        const nodes = $("#ticket-show h2.heading").childNodes;
        for (const node of nodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                ticket = node.textContent;
                break;
            }
        }
        const link = clockifyButton.createButton("[" + ticket + "] " + desc);
        link.style.marginLeft = "18px";
        link.style.marginTop = "10px";
        link.style.marginBottom = "20px";
        link.style.display = "inline-flex";
        link.style.verticalAlign = "middle";
        elem.prepend(link);
    }
);
