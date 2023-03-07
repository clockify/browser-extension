import React, { useEffect, useState } from 'react';
import useCustomField from './useCustomField';
import locales from '../../helpers/locales';

const CustomFieldText = ({ cf, updateValue, setIsValid }) => {
	const [
		{ id, index, value, isDisabled, placeHolder, title, manualMode, required },
		setValue,
		storeValue,
	] = useCustomField(cf, updateValue);

	const handleChange = (e) => {
		const val = e.target.value;
		setIsValid({ id: id, isValid: !(required && !val) });
		setValue(val);
	};

	const handleBlur = (e) => {
		e.preventDefault();
		storeValue();
		manualMode && updateValue(id, e.target.value, isValid);
	};

	const isNotValid = required && !value;

	useEffect(() => {
		setIsValid({ id: id, isValid: !(required && !cf.value) });
	}, []);

	return (
		<>
			<div
				key={id}
				index={index}
				className={`custom-field-ta${isDisabled ? '-disabled' : ''}`}
			>
				<textarea
					index={index}
					rows="1"
					className={`custom-field-text${isDisabled ? '-disabled' : ''} ${
						isNotValid ? 'custom-field-required' : ''
					}`}
					title={title}
					placeholder={placeHolder}
					disabled={isDisabled}
					value={!!value ? value : ''}
					onChange={handleChange}
					onBlur={handleBlur}
				/>
			</div>
			{isNotValid && (
				<p className="field-required-message">
					*{cf.wsCustomField.name} {locales.FIELD_REQUIRED}
				</p>
			)}
		</>
	);
};

export default CustomFieldText;
