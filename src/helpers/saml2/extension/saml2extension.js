let aBrowser = chrome || browser;

let onMessageHandler = (message) => {

    aBrowser.runtime.onMessage.removeListener(onMessageHandler);

    let form = document.createElement("form");
    form.setAttribute("method", "post");
    form.setAttribute("action", message.url);
    form.setAttribute("accept-charset", "utf-8")

    const hiddenSamlRequest = document.createElement("input");
    hiddenSamlRequest.setAttribute("type", "hidden");
    hiddenSamlRequest.setAttribute("name", "SAMLRequest");
    hiddenSamlRequest.setAttribute("value", message.SAMLRequest);

    form.appendChild(hiddenSamlRequest);

    const hiddenRelayState = document.createElement("input");
    hiddenRelayState.setAttribute("type", "hidden");
    hiddenRelayState.setAttribute("name", "RelayState");
    hiddenRelayState.setAttribute("value", message.RelayState);

    form.appendChild(hiddenRelayState);

    document.body.appendChild(form);

    form.submit();
}

aBrowser.runtime.onMessage.addListener(onMessageHandler);
