import { useState, useCallback, useEffect, useContext } from 'react';
import { getBrowser } from '../../helpers/browser-helper';
import CustomFieldsContext from './CustomFieldsContext';

// Hook
const useCustomField = (cf, updateValue, value) => {
	const {
		wsCustomField,
		timeEntryId,
		value: initialValue,
		index,
		isUserOwnerOrAdmin,
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

	const { addCustomFieldValuesToState } = useContext(CustomFieldsContext);

	const storeValue = useCallback(
		(optionalValue) => {
			const customFieldToBeSentToBackend = {
				timeEntryId: timeEntryId,
				customFieldId: id,
				value: optionalValue === undefined ? value : optionalValue,
			}
			addCustomFieldValuesToState(customFieldToBeSentToBackend);
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
