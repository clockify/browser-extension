import { UAParser } from 'ua-parser-js';

const aBrowser = chrome || browser;

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

parseUseragent();

async function parseUseragent() {
	const isUseragentAlredyParsed = await getItem('useragentParsed');

	if (isUseragentAlredyParsed) return;

	const { os, browser } = UAParser(navigator.useragent);

	await setItem('useragentParsed', 'true');

	await setItem('osName', os.name);
	await setItem('osVersion', os.version);
	await setItem('browserName', browser.name);
	await setItem('browserVersion', browser.version);
}
