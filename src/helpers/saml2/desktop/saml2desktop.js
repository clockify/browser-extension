const {ipcRenderer} = require('electron');

ipcRenderer.on('saml2Login', (event, arg) => {
    let form = document.createElement("form");
    form.setAttribute("method", "post");
    form.setAttribute("action", arg.url);

    const hiddenSamlRequest = document.createElement("input");
    hiddenSamlRequest.setAttribute("type", "hidden");
    hiddenSamlRequest.setAttribute("name", "SAMLRequest");
    hiddenSamlRequest.setAttribute("value", arg.request);

    form.appendChild(hiddenSamlRequest);

    const hiddenRelayState = document.createElement("input");
    hiddenRelayState.setAttribute("type", "hidden");
    hiddenRelayState.setAttribute("name", "RelayState");
    hiddenRelayState.setAttribute("value", arg.redirectUri);

    form.appendChild(hiddenRelayState);

    document.body.appendChild(form);

    form.submit();
});

