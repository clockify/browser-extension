import React, { useEffect } from 'react';
import useCustomField from './useCustomField';
import locales from '../../helpers/locales';

const CustomFieldNumber = ({ cf, updateValue, setIsValid }) => {
	const [
		{ id, index, value, isDisabled, placeHolder, title, manualMode, required },
		setValue,
		storeValue,
	] = useCustomField(cf, updateValue);

	const handleChange = (e) => {
		const val = e.target.value;
		if (val) {
			setValue(parseFloat(val));
		} else {
			setValue('');
		}

		setIsValid({ id: id, isValid: !(required && !parseFloat(val)) });
		manualMode && updateValue(id, val);
		// handleChangeDelayed.current(parseFloat(val));
	};

	const handleBlur = (e) => {
		e.preventDefault();
		storeValue();
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
				className={`custom-field${isDisabled ? '-disabled' : ''}`}
			>
				<input
					type="number"
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
				/>
			</div>
			{isNotValid && (
				<p className="field-required-message">*{cf.wsCustomField.name} {locales.FIELD_REQUIRED}</p>
			)}
		</>
	);
};

export default CustomFieldNumber;
