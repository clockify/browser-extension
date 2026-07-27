import React, { useEffect, useState } from 'react';
import useCustomField from './useCustomField';

const CustomFieldText = ({ cf, updateValue, setIsValid, cfContainsWrongChars }) => {
	const [value, setValue] = useState(cf.value);

	const [
		{ id, index, isDisabled, placeHolder, title, manualMode, required, description },
		storeValue,
	] = useCustomField(cf, updateValue, value);

	const handleChange = event => {
		const pattern = /<[^>]+>/;
		const isCustomFieldContainsWrongChars = pattern.test(event.target.value);
		cfContainsWrongChars({ id, isCustomFieldContainsWrongChars });
		setValue(event.target.value);
	};

	const handleBlur = event => {
		const enteredValue = event.target.value.trim();

		if (!enteredValue) {
			setValue('');
		}

		event.preventDefault();
		event.stopPropagation();
		setValue(enteredValue);
		storeValue();
		manualMode && updateValue(id, enteredValue);
	};

	const isNotValid = required && !value?.trim();

	useEffect(() => {
		storeValue();
	}, [value]);

	useEffect(() => {
		setValue(cf.value);
	}, [cf.value]);

	useEffect(() => {
		setIsValid({ id: id, isValid: !(required && !value?.trim()) });
	}, [value]);

	return (
		<div key={id} index={index} className={`custom-field-ta${isDisabled ? '-disabled' : ''}`}>
			<textarea
				index={index}
				rows="1"
				className={`custom-field-text${isDisabled ? '-disabled' : ''}`}
				data-testid={`custom-text-field`}
				title={description}
				disabled={isDisabled}
				id={`cf-text-${index}`}
				value={value ?? ''}
				onChange={handleChange}
				onBlur={handleBlur}
			/>

			{!value && (
				<label htmlFor={`cf-text-${index}`} className={'field-required-label-input'}>
					{placeHolder}{' '}
					{required && (
						<span
							data-testid={`custom-text-field-asterisk`}
							className={'field-required-label-asterisk'}>
							*
						</span>
					)}
				</label>
			)}
		</div>
	);
};

export default CustomFieldText;
