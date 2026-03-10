const aBrowser = isChrome() ? chrome : browser;

document.addEventListener('DOMContentLoaded', onDomContentLoaded);

const integrationsTab = $('#integrationsTab');
const filterInput = $('#permission-filter');
const enableAllButton = $('#enable-all');
const disableAllButton = $('#disable-all');
const customUrlInput = $('#custom-domain-url');
const integrationsSelect = $('#origins');
const addCustomUrlButton = $('#add-custom-domain');
const integratonListContainer = $('#integration-list');
const integratonSelectionList = $('#integration-selection-list');

document.addEventListener('click', onClick);
filterInput.addEventListener('input', onFilterChange);
addCustomUrlButton.addEventListener('click', onAddCustomUrl);

showIntegrationList();
addIntegrationSelectionItems();
showIntegrationsWithCustomDomain();

// DOM Helper functions

function $(selector, context = document) {
	return context.querySelector(selector);
}

function $$(selector, context = document) {
	return context.querySelectorAll(selector);
}

function text(selector, context = document) {
	return $(selector, context)?.textContent?.trim();
}

function value(selector, context = document) {
	return $(selector, context)?.value?.trim();
}

// Storage helpers

async function getItem(key) {
	try {
		const result = await aBrowser.storage.local.get(key);

		return result[key] || undefined;
	} catch (error) {
		console.error(`Error getting storage item (key = ${key}). Error:`, error);

		return null;
	}
}

async function setItem(key, value) {
	try {
		await aBrowser.storage.local.set({ [key]: value });
	} catch (error) {
		console.error(`Error setting storage item (key = ${key}). Error:`, error);
	}
}

async function getCurrentUserIntegrationSettings() {
	const userId = await getItem('userId');
	const integrations = await getItem('integrations');

	return integrations[userId];
}

async function setCurrentUserIntegrationSettings(integrations) {
	const currentUserId = await getItem('userId');
	const integrationSettingsForAllUsers = await getItem('integrations');

	const currentUserUpdatedIntegrationSettings = { [currentUserId]: integrations };

	await setItem('integrations', {
		...integrationSettingsForAllUsers,
		...currentUserUpdatedIntegrationSettings,
	});
}

async function getUserSettingsForIntegrationByName(name) {
	const integrations = await getCurrentUserIntegrationSettings();

	return integrations.find(integration => integration.name.toLowerCase() === name.toLowerCase());
}

// Localization

async function onDomContentLoaded() {
	const language = await getItem('lang');
	await clockifyLocales.onProfileLangChange(language);
	const localesScript = document.createElement('script');
	localesScript.src = 'contentScripts/clockifyLocales.js';
	document.body.appendChild(localesScript);

	integrationsTab.innerText = clockifyLocales.INTEGRATIONS;

	$('#h11').innerText = `Clockify - ${clockifyLocales.INTEGRATIONS}`;
	$('#h21').innerText = clockifyLocales.ENABLE_INTEGRATIONS;
	$('#p11').innerText =
		clockifyLocales.ENABLE_TOOLS + '\n' + clockifyLocales.ENABLE_ALL_INTEGRATIONS;

	$('#enable-all').innerText = clockifyLocales.ENABLE_ALL;
	$('#disable-all').innerText = clockifyLocales.DISABLE_ALL;

	$('#custom-domains').innerText = clockifyLocales.CUSTOM_DOMAINS;

	$('#tool-hosted').innerText =
		clockifyLocales.HOSTED_ON_CUSTOM_DOMAIN +
		'\n' +
		clockifyLocales.ENTER_DOMAIN_NAME +
		'\n' +
		clockifyLocales.PORTS_NOT_SUPPORTED;

	$('#add-custom-domain').innerText = clockifyLocales.ADD;
	$('#custom-domain-url').placeholder = clockifyLocales.CUSTOM_DOMAINS + ' url';
}

// Core logic

async function onClick({ target }) {
	if (target.matches('#enable-all')) {
		onEnableAllClick();
		return;
	}

	if (target.matches('#disable-all')) {
		onDisableAllClick();
		return;
	}

	if (target.matches('#integration-list input[type="checkbox"]')) {
		const name = target.getAttribute('data-integration-name');
		const isChecked = target.checked;

		const currentUserIntegrationSettings = await getCurrentUserIntegrationSettings();

		const currentUserUpdatedIntegrationSettings = currentUserIntegrationSettings.map(
			integration => {
				if (integration.name.toLowerCase() !== name.toLowerCase()) return integration;

				return { ...integration, isEnabled: isChecked };
			}
		);

		await setCurrentUserIntegrationSettings(currentUserUpdatedIntegrationSettings);

		const { sendMessage } = aBrowser.runtime;
		const eventName = isChecked ? 'enableIntegration' : 'disableIntegration';

		await sendMessage({ eventName, options: { name } });

		return;
	}

	if (target.matches('span#deleteButton')) {
		const name = target.getAttribute('data-integration-name');

		const currentUserIntegrationSettings = await getCurrentUserIntegrationSettings();

		const currentUserUpdatedIntegrationSettings = currentUserIntegrationSettings.map(
			integration => {
				if (integration.name.toLowerCase() !== name.toLowerCase()) {
					return integration;
				} else if (integration.name.toLowerCase() !== 'generic integration') {
					return { ...integration, customUrls: [] };
				} else {
					return { ...integration, customUrls: [], isEnabled: false };
				}
			}
		);

		await setCurrentUserIntegrationSettings(currentUserUpdatedIntegrationSettings);

		// Once "delete" button is clicked, all custom URLs are deleted
		// Disable "Genetic integration"
		if (name.toLowerCase() === 'generic integration') {
			const { sendMessage } = aBrowser.runtime;
			const eventName = 'disableIntegration';

			await sendMessage({ eventName, options: { name } });
		} else {
			await aBrowser.runtime.sendMessage({
				eventName: 'updateIntegration',
				options: { name },
			});
		}

		window.location.reload();
	}
}

async function onEnableAllClick() {
	$$('input[type="checkbox"]').forEach(checkbox => (checkbox.checked = true));

	const currentUserIntegrationSettings = await getCurrentUserIntegrationSettings();
	const currentUserUpdatedIntegrationSettings = currentUserIntegrationSettings.map(
		integration => ({ ...integration, isEnabled: true })
	);

	await setCurrentUserIntegrationSettings(currentUserUpdatedIntegrationSettings);
	await aBrowser.runtime.sendMessage({ eventName: 'enableAllIntegrations' });
}

async function onDisableAllClick() {
	$$('input[type="checkbox"]').forEach(checkbox => (checkbox.checked = false));

	const currentUserIntegrationSettings = await getCurrentUserIntegrationSettings();
	const currentUserUpdatedIntegrationSettings = currentUserIntegrationSettings.map(
		integration => ({ ...integration, isEnabled: false })
	);

	await setCurrentUserIntegrationSettings(currentUserUpdatedIntegrationSettings);
	await aBrowser.runtime.sendMessage({ eventName: 'disableAllIntegrations' });
}

function onFilterChange({ target }) {
	const { value } = target;

	if (!value) {
		$$('.integration-data-container').forEach(container => {
			container.style.display = 'block';
		});
	} else {
		$$('.integration-data-container').forEach(container => {
			if (!container.textContent.toLowerCase().includes(value.toLowerCase())) {
				container.style.display = 'none';
			}
		});
	}
}

function isValidUrl(url) {
	try {
		new URL(url);

		return true;
	} catch (error) {
		return false;
	}
}

async function onAddCustomUrl() {
	const url = value('#custom-domain-url');

	if (!url) {
		customUrlInput.style.border = '1.4px solid red';

		setTimeout(() => {
			customUrlInput.style.border = '1px solid rgb(191, 191, 191)';
		}, 1200);

		return;
	}

	const { hostname } = isValidUrl(url)
		? new URL(url)
		: isValidUrl(`https://${url}`)
			? new URL(`https://${url}`)
			: null;

	if (!hostname) {
		customUrlInput.style.border = '1.4px solid red';

		setTimeout(() => {
			customUrlInput.style.border = '1px solid rgb(191, 191, 191)';
		}, 1200);

		return;
	}

	const pattern = `*://${hostname}/*`;

	const name = value('#integration-selection-list');

	$('#custom-domain-url').value = '';

	await addCustomUrl(name, pattern);
}

async function addCustomUrl(name, url) {
	const currentUserIntegrationSettings = await getCurrentUserIntegrationSettings();

	const currentUserUpdatedIntegrationSettings = currentUserIntegrationSettings.map(
		integration => {
			if (integration.name.toLowerCase() !== name.toLowerCase()) {
				return integration;
			} else if (integration.name.toLowerCase() !== 'generic integration') {
				return {
					...integration,
					customUrls: [...new Set([...integration.customUrls, url])],
				};
			} else {
				return {
					...integration,
					customUrls: [...new Set([...integration.customUrls, url])],
					isEnabled: true,
				};
			}
		}
	);

	await setCurrentUserIntegrationSettings(currentUserUpdatedIntegrationSettings);

	// adding custom URL to generic integration
	// should enable it
	if (name.toLowerCase() === 'generic integration') {
		console.log('[Generic integration] Added new URL, update integration');

		const { sendMessage } = aBrowser.runtime;
		const eventName = 'enableIntegration';

		await sendMessage({ eventName, options: { name } });
	} else {
		await aBrowser.runtime.sendMessage({ eventName: 'updateIntegration', options: { name } });
	}

	window.location.reload();
}

async function showIntegrationList() {
	const currentUserIntegrationSettings = await getCurrentUserIntegrationSettings();

	for (const integration of currentUserIntegrationSettings) {
		const { name, urls, isEnabled } = integration;

		if (name.toLowerCase() === 'generic integration') continue;

		const mainUrl = new URLPattern(urls[0]).hostname.replace('*.', '');

		const checkbox = document.createElement('input');
		checkbox.id = name;
		checkbox.type = 'checkbox';
		checkbox.checked = isEnabled;
		checkbox.style.width = '1rem';
		checkbox.style.height = '1rem';
		checkbox.setAttribute('data-integration-name', name);

		const label = document.createElement('label');
		label.setAttribute('for', name);
		label.textContent = `${name} - ${mainUrl}`;

		const container = document.createElement('div');

		container.style.display = 'flex';
		container.style.flexDirection = 'row';
		container.style.gap = '0.5rem';
		container.style.margin = '0.25rem 0';
		container.classList.add('integration-data-container');

		container.append(checkbox);
		container.append(label);

		integratonListContainer.append(container);
	}
}

async function addIntegrationSelectionItems() {
	const userIntegrationSettings = await getCurrentUserIntegrationSettings();

	userIntegrationSettings.forEach(integration => {
		const item = document.createElement('option');

		item.textContent = integration.name;

		integratonSelectionList.append(item);
	});
}

async function showIntegrationsWithCustomDomain() {
	const currentUserIntegrationSettings = await getCurrentUserIntegrationSettings();

	const integrationsWithCustomUrl = currentUserIntegrationSettings.filter(({ customUrls }) =>
		Boolean(customUrls.length)
	);

	integrationsWithCustomUrl.forEach(integration => {
		const { customUrls, name } = integration;

		const container = document.createElement('div');

		container.id = 'custom-permissions-list';

		container.style.width = '500px';
		container.style.minWidth = '500px';
		container.style.padding = '10px 7px';
		container.style.borderRadius = '2px';
		container.style.marginTop = '2px';
		container.style.background = '#f4f4f4';

		const info = document.createElement('span');
		const deleteButton = document.createElement('span');

		deleteButton.id = 'deleteButton';
		deleteButton.style.fontSize = '14px';
		deleteButton.setAttribute('data-integration-name', name);
		deleteButton.classList.add('settings__custom_domains__remove');

		const urls = customUrls.map(url => url.replace('/*', '').replace('*://', '')).join(', ');

		info.textContent = `${urls} - ${name}`;
		deleteButton.textContent = 'delete';

		container.append(info);
		container.append(deleteButton);

		$('#settings__custom-domains__custom-perm-container').append(container);
	});
}

function isChrome() {
	return TARGET_BROWSER_FOR_CLOCKIFY_EXT.toLowerCase() === 'chrome';
}
