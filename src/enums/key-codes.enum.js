const keyCodes = { enter: [13], minus: [189, 109, 173] };
Object.freeze(keyCodes);

export function getKeyCodes() {
	return keyCodes;
}
