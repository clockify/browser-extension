import React, { useEffect, useState, useRef } from 'react';
import useCustomField from './useCustomField';
import { getBrowser } from '../../helpers/browser-helper';
import locales from '../../helpers/locales';

const NUMBER_FORMATS = {
	COMMA_PERIOD: 'en-US',
	PERIOD_COMMA: 'de-DE',
	QUOTATION_MARK_PERIOD: 'de-CH',
	SPACE_COMMA: 'fr-FR',
};

const sanitizeInput = (value) => {
	value = String(value);
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

	return sanitizedValue;
};

const localizeNumber = (num, format) => {
	num = sanitizeInput(num);
	num = num.replace(',', '.');
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

	return new Intl.NumberFormat(locale).format(num);
};

function delocalizeNumber(formattedNumber, format) {
	//test if the last character is not a number
	if (/\D$/.test(formattedNumber)) {
		// Remove the last character
		formattedNumber = formattedNumber.slice(0, -1);
	}
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

	const sanitizedNumber = String(formattedNumber)
		.split(groupSeparator)
		.join('')
		.replace(decimalSeparator, '.');

	return Number(sanitizedNumber);
}

const CustomFieldNumber = ({ cf, updateValue, numberFormat, setIsValid }) => {
	let [
		{ id, index, value, isDisabled, placeHolder, title, manualMode, required },
		setValue,
		storeValue,
	] = useCustomField(cf, updateValue);
	const inputRef = useRef(null);

	const handleChange = (e) => {
		const { value } = e.target;
		setValue(sanitizeInput(value));
	};

	const incrementOrDecrement = (incVal = 1) => {
		if (value) {
			const delocalizedValue = delocalizeNumber(value, numberFormat);
			setValue(parseInt(delocalizedValue) + incVal);
		} else {
			setValue(incVal);
		}
	};

	const handleFocus = () => {
		setValue(value ? delocalizeNumber(value, numberFormat) : '');
	};
	const handleBlur = (e) => {
		e.preventDefault();
		const { value } = e.target;
		if (!value) return;

		setValue(localizeNumber(value, numberFormat));
		!manualMode &&
			storeValue((number) => delocalizeNumber(number, numberFormat));
	};

	const clearIncrement = () => {
		inputRef.current.focus();
	};

	const isNotValid = required && !value;
	useEffect(() => {
		value && setValue(localizeNumber(value, numberFormat));
		setIsValid({ id: id, isValid: !(required && !cf.value) });
	}, []);

	useEffect(() => {
		cf.value && setValue(localizeNumber(cf.value, numberFormat));
		setIsValid({ id: id, isValid: !(required && !cf.value) });
	}, [cf.value]);

	useEffect(() => {
		setIsValid({ id: id, isValid: !(required && !value) });
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
					value={value ? String(value) : ''}
					className={`custom-field-number${isDisabled ? '-disabled' : ''} ${
						isNotValid ? 'custom-field-required' : ''
					}`}
					title={title}
					placeholder={placeHolder}
					disabled={isDisabled}
					onChange={handleChange}
					onBlur={handleBlur}
					onFocus={handleFocus}
				/>
				<div className="input-stepper">
					<div
						className="input-stepper-wrapper"
						onMouseDown={() => incrementOrDecrement(1)}
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
						onMouseDown={() => incrementOrDecrement(-1)}
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
