//splits and returns url components like the protocol, hostname, pathname...
function parseURLString(str) {
	let protocol = '';
	let hostname = '';
	let pathname = '';
	let search = '';
	let hash = '';

	if (str.slice(-1) !== '/') str = str + '/';

	let i = str.indexOf('://');
	if (i !== -1) {
		protocol = str.substring(0, i);
		str = str.substring(i + 3);

		i = str.indexOf('/');
		hostname = str.substring(0, i);
		str = str.substring(i + 1);
	}

	i = str.indexOf('#');
	if (i !== -1) {
		hash = str.substring(i + 1);
		str = str.substring(0, i);
	}

	str = str
		.replace(/(:\w+)\?/g, (_, name) => name + '§')
		.replace(/\*\?/g, '*§')
		.replace(/\)\?/g, ')§');
	i = str.indexOf('?');

	if (i !== -1) {
		pathname = str.substring(0, i).replace('§', '?');
		search = str.substring(i + 1).replace('§', '?');
	} else {
		pathname = str.replace('§', '?');
	}

	return { protocol, hostname, pathname, search, hash };
}

// compares url protocol(http/s), compares hostname(git.coing.com), and path(/tasks), to see if the requested domain matches given pattern
function matchPatternAndLink(pattern, link) {
	let isMatching = true;

	if (pattern.protocol !== '*') {
		if (pattern.protocol !== link.protocol) isMatching = false;
	}

	//split hostname one.domain.com into parts, [one, domain, com], so that each of them can be matched with a wildcard(*) or an exact match
	if (pattern.hostname !== '*') {
		let patternHostnameElements = pattern.hostname.split('.');
		let linkHostnameElements = link.hostname.split('.');
		if (patternHostnameElements.length === linkHostnameElements.length) {
			for (let i = 0; i < patternHostnameElements.length; i++) {
				if (patternHostnameElements[i] !== '*') {
					if (patternHostnameElements[i] !== linkHostnameElements[i])
						isMatching = false;
				}
			}
		} else {
			isMatching = false;
		}
	}

	pattern.pathname = removeTrailingSlash(pattern.pathname);
	link.pathname = removeTrailingSlash(link.pathname);
	if (pattern.pathname && pattern.pathname !== '*') {
		if (pattern.pathname !== link.pathname) isMatching = false;
	}

	return isMatching;
}

function removeTrailingSlash(str) {
	return str.replace(/\/+$/, '');
}

function isMatchingURL(pattern, url) {
	let urlInfo = parseURLString(url);
	//split the pattern string into an array in case that there are multiple url patterns to match
	let urlPatterns = pattern.split(',');
	//returns first match
	return !!urlPatterns.find((pattern) =>
		matchPatternAndLink(parseURLString(pattern), urlInfo)
	);
}
