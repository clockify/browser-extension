const path = require('path');
const fse = require('fs-extra');

const [origin, targetOne, targetTwo] = parseParameters();

const isOriginRemote = Boolean(origin === 'remote');

const VALID_SOURCE = 'https://clockify.me/downloads/selectors.json';
const INVALID_SOURCE = 'invalid-link-for-remote-selectors-storage';

const REPLACEMENT_STRING = isOriginRemote ? VALID_SOURCE : INVALID_SOURCE;
const STRING_FOR_REPLACE = isOriginRemote ? INVALID_SOURCE : VALID_SOURCE;

const isEachParametarValid = validateParameters();

if (!isEachParametarValid) {
	const alert = `You tried to use npm script in the wrong way. Correct usage is 👇`;
	const usage = `npm run use.<remote | local>.selectors [both? | chrome? | firefox?]`;

	const message = format([alert, usage]);

	return console.log(message);
}

detectTargetBuilds();

async function detectTargetBuilds() {
	const isChromeTarget = isTarget('chrome');
	const isFirefoxTarget = isTarget('firefox');

	const compiledChromeBuildPath = path.join(__dirname, '..', 'chrome.dev');
	const compiledFirefoxBuildPath = path.join(__dirname, '..', 'firefox.dev');

	const targetFilePath = ['api-services', 'selectors-service.js'];

	const chromeTargetFile = path.join(compiledChromeBuildPath, ...targetFilePath);
	const firefoxTargetFile = path.join(compiledFirefoxBuildPath, ...targetFilePath);

	isChromeTarget && (await changeSelectorsSource(chromeTargetFile, 'chrome.dev'));
	isFirefoxTarget && (await changeSelectorsSource(firefoxTargetFile, 'firefox.dev'));
}

async function changeSelectorsSource(buildPath, buildName) {
	const fileContents = await fse.readFile(buildPath, 'utf-8');

	if (!fileContents.includes(STRING_FOR_REPLACE)) {
		const line1st = `FAILURE -> ${buildName} | selectors-service.js:`;
		const line2nd = `The string "${STRING_FOR_REPLACE}"`;
		const line3rd = `does not exist in the file, so it cannot be replaced`;
		const line4rd = `with "${REPLACEMENT_STRING}" string.`;

		const message = format([line1st, line2nd, line3rd, line4rd]);

		return console.log(message);
	}

	fse.writeFile(buildPath, fileContents.replace(STRING_FOR_REPLACE, REPLACEMENT_STRING));

	const line1st = `SUCCESS -> ${buildName} | selectors-service.js:`;
	const line2nd = `String "${STRING_FOR_REPLACE}" is`;
	const line3rd = `replaced by string "${REPLACEMENT_STRING}"`;
	const line4th = `${buildName} build is now using ${origin} selectors.`;
	const line5th = `Be aware that recompiling can change origin of selectors!`;

	const message = format([line1st, line2nd, line3rd, line4th, line5th]);

	console.log(message);
}

function parseParameters() {
	return process.argv.slice(2).map(parameter => parameter.toLowerCase());
}

function validateParameters() {
	const is1stParametarValid = [undefined, 'remote', 'local'].includes(origin);
	const is2ndParametarValid = [undefined, 'both', 'chrome', 'firefox'].includes(targetOne);
	const is3rdParametarValid = [undefined, 'both', 'chrome', 'firefox'].includes(targetTwo);

	return is1stParametarValid && is2ndParametarValid && is3rdParametarValid;
}

function format(messages) {
	return messages.reduce((accumulator, current) => `${accumulator}- ${current}\n`, '\n');
}

function isTarget(browser) {
	const targets = [targetOne, targetTwo].filter(Boolean);

	return targets.includes(browser) || targets.includes('both') || Boolean(!targets.length);
}
