const fs = require('fs');
const path = require('path');
const webKeysWeUse = require('./web-keys-we-use.json');

let lang = process.argv[2];
let printAllKeys = false;
let langs = [lang];

if (!lang) {
	langs = ['en'];
	printAllKeys = true;
}

if (lang === 'all') {
	langs = ['en', 'ru', 'pt', 'es', 'ko', 'ja', 'fr', 'de'];
}

function parseObjectProperties(pre, obj) {
	for (var k in obj) {
		if (typeof obj[k] === 'object') {
			parseObjectProperties(pre === '' ? k : pre + '__' + k, obj[k]);
		} else {
			allKeys[pre + '__' + k] = obj[k];
		}
	}
}

let parts = [];

function getVal(obj, i = 0) {
	return i < parts.length ? getVal(obj[parts[i]], i + 1) : obj;
}

langs.forEach((lang) => {
	var jsonPath = path.join(
		__dirname,
		'.',
		'web-locales',
		`clockify-web-${lang}.json`
	);

	const data = fs.readFileSync(jsonPath, 'utf8');
	const web = JSON.parse(data);

	const allKeys = {};

	if (printAllKeys) {
		parseObjectProperties('', web);
		const outPath = path.join(__dirname, 'all-keys.txt');
		console.log('Created:', outPath);
		fs.writeFileSync(outPath, JSON.stringify(allKeys, null, 2), 'utf8');
		process.exit(0);
	}

	parts = [];

	const missingKeys = [];
	const res = {};

	Object.keys(webKeysWeUse).forEach((key) => {
		parts = key.split('__');
		let message = getVal(web);
		if (message) {
			const extKey = webKeysWeUse[key];
			res[extKey] = {
				message,
			};
		} else {
			missingKeys.push(key);
		}
	});

	if (missingKeys.length > 0) {
		missingKeys.forEach((key) => console.log(key));
	}

	res['appName'] = {
		message: res['EXTENSION__APPNAME_MESSAGE'].message,
		description: res['EXTENSION__APPNAME_DESCRIPTION'].message,
	};
	delete res['EXTENSION__APPNAME_MESSAGE'];
	delete res['EXTENSION__APPNAME_DESCRIPTION'];

	res['appDesc'] = {
		message: res['EXTENSION__APPDESC_MESSAGE'].message,
		description: res['EXTENSION__APPDESC_DESCRIPTION'].message,
	};
	delete res['EXTENSION__APPDESC_MESSAGE'];
	delete res['EXTENSION__APPDESC_DESCRIPTION'];

	const outPath = path.join(__dirname, '..', '_locales', lang, 'messages.json');
	console.log('Created:', outPath);
	fs.writeFile(outPath, JSON.stringify(res, null, 2), 'utf8', (writeError) => {
		if (writeError) {
			process.exit(1);
		}
	});
});
