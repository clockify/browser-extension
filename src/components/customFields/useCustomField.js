import { useState, useCallback } from 'react';
import { getBrowser } from '../../helpers/browser-helper';

// Hook
const useCustomField = (cf, updateValue, value) => {
	const {
		wsCustomField,
		timeEntryId,
		value: initialValue,
		index,
		isUserOwnerOrAdmin,
		redrawCounter,
		manualMode,
		required,
	} = cf;

	const {
		id,
		name,
		allowedValues,
		description,
		placeholder,
		status,
		type,
		onlyAdminCanEdit,
	} = wsCustomField;

	const placeHolder = !!placeholder ? placeholder : name.toLowerCase();
	const title = !!description ? description : name.toLowerCase();
	const placeHolderOrName = !placeholder ? name : placeholder;

	const isDisabled = onlyAdminCanEdit && !isUserOwnerOrAdmin;

	const storeValue = useCallback(
		(optionalValue) => {
			getBrowser().runtime.sendMessage(
				{
					eventName: 'submitCustomField',
					options: {
						timeEntryId: timeEntryId,
						customFieldId: id,
						value: optionalValue === undefined ? value : optionalValue,
					},
				},
				(response) => {
					if (!response) {
						return response;
					}
					const { data, status } = response;
					if (status !== 201) {
						if (status === 400) {
							console.log('Problem with Custom Field Value.');
						}
					} else {
						updateValue(id, value);
						// setValue(data);
					}
				}
			);
		},
		[value]
	);

	return [
		{
			id,
			index,
			value,
			isDisabled,
			placeHolder,
			placeHolderOrName,
			title,
			allowedValues,
			redrawCounter,
			manualMode,
			required,
			name,
			initialValue,
			timeEntryId,
			description,
		},
		storeValue,
	];
};

export default useCustomField;
