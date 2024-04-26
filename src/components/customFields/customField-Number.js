import React, { useEffect, useState, useRef } from 'react';
import useCustomField from './useCustomField';
import { getBrowser } from '../../helpers/browser-helper';
import locales from '../../helpers/locales';

let format;

const isValueless = (value) => !Boolean(value) && value !== 0;

const isNumberNegative = (string) => string.startsWith('-');

const prependMinus = (string) => '-'.concat(string);

const toString = (number, { fixSeparator } = {}) => {
	const { decimalSeparator } = getSeparators();

	// if number input is typeof number
	// dot will be used as separator, no matter what number format is choosen
	// this will replace . separator to one provided by format
	if (typeof number === 'number') {
		return String(number).replace('.', decimalSeparator);
	}

	// user can input . or , as separator
	// no matter what number format is choosen
	// this will replace used separator to one provided by format
	if (fixSeparator) {
		const { decimalSeparator } = getSeparators();

		if (decimalSeparator === '.') {
			return number?.replace(',', decimalSeparator);
		}

		if (decimalSeparator === ',') {
			return number?.replace('.', decimalSeparator);
		}
	}

	return String(number);
};

const NUMBER_FORMATS = {
	COMMA_PERIOD: 'en-US',
	PERIOD_COMMA: 'de-DE',
	QUOTATION_MARK_PERIOD: 'de-CH',
	SPACE_COMMA: 'fr-FR',
};

function getSeparators() {
	const locale = NUMBER_FORMATS[format];
	if (!locale) {
		throw new Error('Invalid format provided');
	}

	const formatter = new Intl.NumberFormat(locale);

	if (!formatter.formatToParts) {
		console.log('formatToParts is not supported');
	}

	const parts = formatter.formatToParts(12345.67);
	const groupSeparator =
		format === 'QUOTATION_MARK_PERIOD'
			? "'"
			: parts.find((part) => part.type === 'group')?.value;
	const decimalSeparator =
		format === 'QUOTATION_MARK_PERIOD'
			? '.'
			: parts.find((part) => part.type === 'decimal')?.value;

	return { groupSeparator, decimalSeparator };
}

const sanitizeInput = (value) => {
	value = String(value);
	const startsWithMinus = isNumberNegative(value);
	// Matches any character that is NOT a number, dot, or comma
	const regex = /[^0-9.,]/g;

	// Check if the input value matches the regex
	if (value.match(regex)) {
		// Replace invalid characters with an empty string
		value = value.replace(regex, '');
	}

	// Keep track of whether a dot or a comma has been used
	let dotUsed = false;
	let commaUsed = false;
	let sanitizedValue = '';
	// ALLOWS ONLY ONE DOT OR COMMA
	for (const char of value) {
		// If the character is a dot and neither a dot nor a comma has been used, allow it
		if (char === '.' && !dotUsed && !commaUsed) {
			sanitizedValue += char;
			dotUsed = true;
		}
		// If the character is a comma and neither a dot nor a comma has been used, allow it
		else if (char === ',' && !dotUsed && !commaUsed) {
			sanitizedValue += char;
			commaUsed = true;
		}
		// If the character is a number, add it to the sanitized value
		else if (/\d/g.test(char)) {
			sanitizedValue += char;
		}
	}

	return startsWithMinus ? prependMinus(sanitizedValue) : sanitizedValue;
};

const localizeNumber = (num) => {
	if (isValueless(num)) return null;
	num = sanitizeInput(num);
	const startsWithMinus = isNumberNegative(num);
	num = num.replace('-', '').replace(',', '.');
	if (/\D$/.test(num)) {
		// Remove the last character
		num = num.slice(0, -1);
	}
	const locale = NUMBER_FORMATS[format];
	if (!locale) {
		throw new Error('Invalid format provided');
	}

	// since clockify web does not use the standardized format we
	// we have to adapt to it by making a custom number format
	// instead of using an apostrophe ` we now use the single quote '
	if (format === 'QUOTATION_MARK_PERIOD') {
		const formatter = new Intl.NumberFormat(locale);

		return formatter
			.formatToParts(num)
			.map(({ type, value }) => {
				switch (type) {
					case 'group':
						return "'";
					default:
						return value;
				}
			})
			.join('');
	}

	const formattedNumber = new Intl.NumberFormat(locale).format(num);

	return startsWithMinus ? prependMinus(formattedNumber) : formattedNumber;
};

function delocalizeNumber(formattedNumber) {
	if (isValueless(formattedNumber)) return null;

	formattedNumber = toString(formattedNumber);

	if (/\D$/.test(formattedNumber)) {
		//test if the last character is not a number
		// Remove the last character
		formattedNumber = formattedNumber.slice(0, -1);
	}

	const { groupSeparator } = getSeparators();

	let sanitizedNumber = formattedNumber
		.replaceAll(groupSeparator, '')
		.replace(',', '.');

	return Number(sanitizedNumber);
}

function sanitizeInitialValue(valueFromServer) {
	if (isValueless(valueFromServer)) return null;

	valueFromServer = toString(valueFromServer);

	return localizeNumber(valueFromServer);
}

const CustomFieldNumber = ({ cf, updateValue, numberFormat, setIsValid }) => {
	format = numberFormat;
	const [value, setValue] = useState();

	const [
		{ id, index, isDisabled, placeHolder, manualMode, required, description },
		storeValue,
	] = useCustomField(cf, updateValue, value);
	const inputRef = useRef(null);

	const incrementOrDecrement = (incVal = 1) => {
		if (value) {
			const delocalizedValue = delocalizeNumber(value);
			setValue(parseInt(delocalizedValue) + incVal);
		} else {
			setValue(incVal);
		}
	};

	const clearIncrement = () => {
		inputRef.current.focus();
	};

	const isNotValid = required && isValueless(value);

	const handleChange = (event) => {
		const enteredValue = event.target.value;
		const sanitizedValue = sanitizeInput(enteredValue);

		setValue(sanitizedValue);
	};

	const handleFocus = () => {
		const delocalizedNumber = delocalizeNumber(value);

		setValue(delocalizedNumber);
	};

	const handleBlur = (event) => {
		event.preventDefault();

		const enteredValue = toString(value, { fixSeparator: true });

		const localizedNumber = localizeNumber(enteredValue);
		const delocalizedNumber = delocalizeNumber(enteredValue);

		setValue(localizedNumber);
		manualMode && updateValue(id, delocalizedNumber);
		!manualMode && storeValue(delocalizedNumber);
	};

	useEffect(() => {
		const delocalizedNumber = delocalizeNumber(value);
		storeValue(delocalizedNumber);
	}, [value])

	useEffect(() => {
		const initialValue = sanitizeInitialValue(cf.value);
		setValue(initialValue);
	}, [cf.value]);

	useEffect(() => {
		setIsValid({ id: id, isValid: !(required && isValueless(value)) });
	}, [value]);

	return (
		<>
			<div
				key={id}
				index={index}
				className={`custom-field-number custom-field${
					isDisabled ? '-disabled' : ''
				}`}
			>
				<input
					type="text"
					ref={inputRef}
					index={index}
					value={isValueless(value) ? '' : value}
					className={`custom-field-number${isDisabled ? '-disabled' : ''} ${
						isNotValid ? 'custom-field-required' : ''
					}`}
					title={description}
					placeholder={placeHolder}
					disabled={isDisabled}
					onChange={handleChange}
					onBlur={handleBlur}
					onFocus={handleFocus}
				/>
				{!isDisabled && (
					<div className="input-stepper">
						<div
							className="input-stepper-wrapper"
							onMouseDown={(event) => {
								event.preventDefault();
								incrementOrDecrement(1);
							}}
							onMouseUp={clearIncrement}
						>
							<span
								className="input-stepper-up"
								style={{
									content: `url(${getBrowser().runtime.getURL(
										'assets/images/arrow-light-mode-up.png'
									)})`,
								}}
							></span>
						</div>
						<div
							className="input-stepper-wrapper"
							onMouseDown={(event) => {
								event.preventDefault();
								incrementOrDecrement(-1);
							}}
							onMouseUp={clearIncrement}
						>
							<span
								className="input-stepper-down"
								style={{
									content: `url(${getBrowser().runtime.getURL(
										'assets/images/arrow-light-mode.png'
									)})`,
								}}
							></span>
						</div>
					</div>
				)}
			</div>
			{isNotValid && (
				<p className="field-required-message">
					*{cf.wsCustomField.name} {locales.FIELD_REQUIRED}
				</p>
			)}
		</>
	);
};

export default CustomFieldNumber;
