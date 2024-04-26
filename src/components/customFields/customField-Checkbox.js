import React, { useEffect, useState } from 'react';
import useCustomField from './useCustomField';
import Switch from 'antd/lib/switch';
import locales from '../../helpers/locales';

const CustomFieldCheckbox = ({ cf, updateValue, setIsValid }) => {
	const [value, setValue] = useState(cf.value);

	const [
		{
			id,
			index,
			isDisabled,
			placeHolder,
			placeHolderOrName,
			title,
			manualMode,
			name,
			description,
		},
		storeValue,
	] = useCustomField(cf, updateValue, value);

	const handleChange = () => {
		const updatedValue = !value;

		setValue(updatedValue);
		storeValue(updatedValue);
		manualMode && updateValue(id, updatedValue);
	};

	useEffect(() => {
		storeValue();
	}, [value])

	useEffect(() => {
		setValue(cf.value);
	}, [cf.value]);

	useEffect(() => {
		setIsValid({ id: id, isValid: true });
	}, [value]);

	return (
		<div
			key={id}
			index={index}
			className={`custom-field${isDisabled ? '-disabled' : ''}`}
		>
			<div
				className={`custom-field-inner-checkbox${
					isDisabled ? '-disabled' : ''
				}`}
			>
				{/* <div className="pomodoro__border"></div>
                <div className="pomodoro__box__content"> */}
				<Switch
					id={`switchboxCustomField${index}`}
					className="pomodoro__switch"
					checked={value}
					onChange={handleChange}
					disabled={isDisabled}
				/>
				<span
					className="clockify-switch-label"
					htmlFor={`switchboxCustomField${index}`}
					title={description}
				>
					{placeHolder ?? name}
				</span>
				{/* </div> */}
			</div>
		</div>
	);
};

export default CustomFieldCheckbox;
