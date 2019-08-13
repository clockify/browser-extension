const aBrowser = chrome || browser;
let clockifyOrigins = [];
const userId = localStorage.getItem('userId');

document.addEventListener('DOMContentLoaded', initLoad);
document.getElementById('settings__permissions-container')
    .addEventListener('click', (e) => {
        if (e.target.tagName === "INPUT" && e.target.type === "checkbox") {
            this.save_permissions();
        }
});

aBrowser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request === 'closeOptionsPage') {
        window.close();
    }
});

const integrationsTab = document.getElementById('integrationsTab');
integrationsTab.className += " active";

document.getElementById('enable-all')
    .addEventListener('click', this.enableAllOrigins);
document.getElementById('disable-all')
    .addEventListener('click', this.disableAllOrigins);
document.getElementById('permission-filter')
    .addEventListener('keyup', this.filterPermissions);
document.getElementById('add-custom-domain')
    .addEventListener('click', addCustomDomain);
document.querySelector('#settings__custom-domains__custom-perm-container')
    .addEventListener('click', removeCustomDomain);
integrationsTab.addEventListener('click', openTab);

function createOriginList() {
    fetch('integrations/integrations.json')
        .then(result => result.json())
        .then(data => {
            clockifyOrigins = data;
            addIntegrationsInPermissionsIfNewIntegrationsExist(clockifyOrigins);
            let origins = document.createElement('select');
            let option;
            origins.id = 'origins';
            origins.style.minHeight = '2em';
            origins.style.marginRight = '10px';
            let permContainer = document.getElementById('settings__permissions-container');
            permContainer.style.height = '500px';
            permContainer.style.width = '500px';
            permContainer.style.overflowY = 'scroll';
            permContainer.style.border = '1px solid #bbb';
            permContainer.style.borderRadius = '2px';

            for(let key in data) {
                const checkbox = addCheckbox(key, data[key]);
                permContainer.appendChild(checkbox);

                if (!data[key].clone) {
                    option = document.createElement('option');
                    option.id = 'origin';
                    option.value = key;
                    option.setAttribute('data-id', key);
                    option.textContent = data[key].name;

                    origins.appendChild(option);
                }
            }
            replaceContent('#settings__custom-domains__origins-container', origins);
            restore_options();
        });
}


function initLoad() {
    createOriginList();
    showCustomDomains();
}

function restore_options() {
    aBrowser.storage.local.get(['permissions'], (result) => {
        if (result && result.permissions && result.permissions.length > 0) {
            const permissionsByUser =
                result.permissions.filter(permission => permission.userId === userId)[0];

            if (permissionsByUser) {
                for (let key in permissionsByUser.permissions.filter(p => !p.isCustom)) {
                    document.getElementById(permissionsByUser.permissions[key].domain).checked =
                        permissionsByUser.permissions[key].isEnabled;
                }
            }
        }
    });
}

function save_permissions() {
    aBrowser.storage.local.get(['permissions'], (result) => {
        if (result && result.permissions && result.permissions.length > 0) {
            const permissionsForStorage = result.permissions;
            const permissionsByUser =
                result.permissions.filter(permission => permission.userId === userId)[0];

            if (permissionsByUser) {
                for (let i in permissionsByUser.permissions.filter(p => !p.isCustom)) {
                    let permission = permissionsByUser.permissions[i];
                    permission['isEnabled'] =
                        document.getElementById(permissionsByUser.permissions[i].domain).checked;
                }
            }

            aBrowser.storage.local.set({"permissions": permissionsForStorage});
        }
    });
}

function addCustomDomain() {
    aBrowser.storage.local.get(['permissions'], (result) => {
        let customDomain =
            extractCustomDomain(document.getElementById('custom-domain-url').value);
        const selectedOrigin = document.querySelector('#origins').value;
        const permissionsForStorage = result.permissions;
        const permissionsByUser =
            result.permissions.filter(permission => permission.userId === userId)[0];
        let newPermission = {};

        if (permissionsByUser) {
            for (let key in clockifyOrigins) {
                if (key === selectedOrigin) {
                    newPermission['domain'] = customDomain;
                    newPermission['isEnabled'] = true;
                    newPermission['script'] = clockifyOrigins[key].script;
                    newPermission['name'] = clockifyOrigins[key].name;
                    newPermission['isCustom'] = true;

                    permissionsByUser.permissions.push(newPermission);
                    break;
                }
            }
        }

        aBrowser.storage.local.set({"permissions": permissionsForStorage}, () => {
            document.getElementById('custom-domain-url').value = '';
            showCustomDomains();
        });
    });
}

function showCustomDomains() {
    let customDomainsHtml = document.createElement('ul');
    let li;
    let dom;

    customDomainsHtml.id = 'custom-permissions-list';
    customDomainsHtml.className = 'settings__custom-domains__custom-origin-list';

    aBrowser.storage.local.get(['permissions'], (result) => {
       result.permissions
            .filter(permissionByUser => permissionByUser.userId === userId)[0].permissions
            .filter(permission => permission.isCustom)
            .forEach(p => {
                li = document.createElement('li');

                dom = document.createElement('a');
                dom.className = 'settings__custom_domains__remove';
                dom.textContent = 'delete';
                li.appendChild(dom);

                dom = document.createElement('strong');
                dom.textContent = p.domain;
                li.appendChild(dom);

                li.appendChild(document.createTextNode(' - '));

                dom = document.createElement('i');
                dom.textContent = p.name;
                li.appendChild(dom);

                customDomainsHtml.appendChild(li);
            });

       if (customDomainsHtml.childNodes.length > 0) {
           replaceContent(
               '#settings__custom-domains__custom-perm-container',
               customDomainsHtml
           );
       } else {
           if (
               document.getElementById('settings__custom-domains__custom-perm-container')
                   .childNodes.length > 0) {
               document.getElementById('settings__custom-domains__custom-perm-container')
                   .removeChild(document.getElementById('custom-permissions-list'));
           }
       }
    });
}

function removeCustomDomain(e) {
    let domain;
    let parent;

    if (e.target.className === 'settings__custom_domains__remove') {
        parent = e.target.parentNode;
        domain = parent.querySelector('strong').textContent;

        aBrowser.storage.local.get(['permissions'], (result) => {
            const permissionsForStorage = result.permissions;
            const permissionsByUser = result.permissions
                .filter(permissionByUser => permissionByUser.userId === userId)[0].permissions;
            permissionsByUser.splice(permissionsByUser
                .findIndex(p => p.isCustom && p.domain === domain), 1);

            aBrowser.storage.local.set({"permissions": permissionsForStorage}, () => {
                showCustomDomains();
            });
        });
    }
}

function filterPermissions(e) {
    let container = document.getElementById('settings__permissions-container');
    let child;
    for (let i in container.getElementsByTagName('div')) {
        if (!isNaN(i)) {
            child = container.childNodes[i];
        }

        if (child) {
            const childInput = child.getElementsByTagName('input')[0];
            if (!childInput.id.includes(e.target.value)) {
                child.style.display = 'none';
            } else {
                child.style.display = 'block';
            }
        }
    }
}

function addCheckbox(key, origin) {
    let div = document.createElement('div');
    let label = document.createElement('label');
    let input = document.createElement('input');
    div.id = 'div-' + key;
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.borderBottom = '1px solid #e8e8e8';
    input.type = 'checkbox';
    input.id = key;
    div.appendChild(input);
    label.style.display = 'inline-block';
    label.style.marginLeft = '15px';
    label.textContent = origin.name + " - " + key;
    div.appendChild(label);

    return div;
}

function enableAllOrigins() {

    for (let key in clockifyOrigins) {
        document.getElementById(key).checked = true;
    }

    save_permissions();
}

function disableAllOrigins() {
    for (let key in clockifyOrigins) {
        document.getElementById(key).checked = false;
    }

    save_permissions();
}

function replaceContent(parentSelector, html) {
    const container = document.querySelector(parentSelector);
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    container.appendChild(html);
}

function extractCustomDomain(url) {
    if (url.includes("://")) {
        url = url.split('://')[1];
    } else if (url.includes('/')){
        url = url.split('/')[0];
    }

    return url;
}

function openTab(event) {
    let i, tabcontent, tablinks, tabName;

    tabName = event.target.textContent.trim().toLowerCase();
    tabcontent = document.getElementsByClassName("settings__content");

    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("settings__tablinks");

    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    event.currentTarget.className += " active";
}

function addIntegrationsInPermissionsIfNewIntegrationsExist(origins) {
    aBrowser.storage.local.get(['permissions'], (result) => {
        let permissionsForStorage = result.permissions;
        const permissionsByUser = permissionsForStorage
            .filter(permissionByUser => permissionByUser.userId === userId)[0];
        const permissionsDomainsByUser = permissionsByUser.permissions
            .map(permission => permission.domain);

        console.log(permissionsForStorage);

        for (let key in clockifyOrigins) {
            if (!permissionsDomainsByUser.includes(key)) {
                let permission = {};
                permission['domain'] = key;
                permission['isEnabled'] = true;
                permission['script'] = clockifyOrigins[key].script;
                permission['name'] = clockifyOrigins[key].name;
                permission['isCustom'] = false;
                permissionsByUser.permissions.push(permission);
            }
        }

        permissionsForStorage = permissionsForStorage.map(permissionForStorage => {
            if (permissionForStorage.userId === userId) {
                permissionForStorage.permissions = permissionsByUser.permissions;
            }

            return permissionForStorage;
        });

        aBrowser.storage.local.set({permissions: permissionsForStorage});
    });
}