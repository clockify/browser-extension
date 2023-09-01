import React, { useState, useEffect } from 'react';
import { offlineStorage } from '../../helpers/offlineStorage';

import CustomField from './customField';
import CustomFieldText from './customField-Text';
import CustomFieldNumber from './customField-Number';
import CustomFieldLink from './customField-Link';
import CustomFieldCheckbox from './customField-Checkbox';
import CustomFieldDropMultiple from './customField-DropMultiple';
import CustomFieldDropSingle from './customField-DropSingle';

export function CustomFieldsContainer({
	timeEntry,
	isUserOwnerOrAdmin,
	manualMode,
	updateCustomFields,
	isInProgress,
	areCustomFieldsValid,
	workspaceSettings,
	cfContainsWrongChars,
}) {
	const [customFields, setCustomFields] = useState([]);
	const [projectId, setProjectId] = useState(timeEntry.projectId);
	const [validatedCustomFields, setValidatedCustomFields] = useState({});

	useEffect(() => {
		const { customFieldValues, projectId } = timeEntry;
		if (customFieldValues && customFieldValues.length > 0) {
			const arr = [];
			const fields = {};
			customFieldValues.forEach((item) => {
				// hopefully we have no INACTIVE here
				const { customFieldId, type, value, timeEntryId } = item; // name,
				const wsCustomField = getWSCustomField(customFieldId);
				let status = wsCustomField.status;
				const { projectDefaultValues } = wsCustomField;
				if (projectDefaultValues && projectDefaultValues.length > 0) {
					const projectEntry = projectDefaultValues.find(
						(x) => x.projectId === projectId
					);
					if (projectEntry) status = projectEntry.status;
				}
				const isCFrequired = isCustomFieldRequired(
					{ customFieldDto: { ...wsCustomField }, ...item },
					value
				);

				if (status === 'VISIBLE') {
					arr.push({
						customFieldId,
						wsCustomField,
						timeEntryId: timeEntry.id, // assert eq item.timeEntryId
						value,
						index: arr.length,
						isUserOwnerOrAdmin,
						isVisible: true,
						redrawCounter: 0,
						manualMode,
						required: isCFrequired,
					});
				}
			});
			//setValidatedCustomFields(fields);
			setCustomFields(arr);
		}
	}, [isUserOwnerOrAdmin, timeEntry]);

	useEffect(() => {
		// if (redrawCustomFields > 0) // not on the first render
		if (projectId !== timeEntry.projectId) {
			setProjectId(timeEntry.projectId);
			onChangeProjectRedrawCustomFields();
		}
	}, [timeEntry]);

	const getWSCustomField = (customFieldId) =>
		offlineStorage.getWSCustomField(customFieldId);

	const updateValue = (customFieldId, value) => {
		// const cf = getWSCustomField(customFieldId);
		// cf.value = value;
		// setCustomFields(customFields);
		const cf = customFields.find((x) => x.customFieldId === customFieldId);
		cf.value = value;
		const arr = customFields.map(({ customFieldId, value }) => ({
			customFieldId,
			sourceType: 'TIMEENTRY',
			value,
		}));
		if (manualMode) {
			updateCustomFields(arr);
		} else {
			updateCustomFields(arr);
		}
	};

	/* 
    Ukoliko user pokuša da kreira entry na time tracker stranici (klikom na Add u manual modu ili zaustavljanjem entrija u timer modu), 
    a da nije uneo vrednost za CF koji je required (a za koji nije definisana defaultna vrednost), 
    korisniku se prikazuje crveni toast “Can’t save, $CFName is empty”, a sam CF koji je required,
    a nema vrednost, se zacrveni (border se zacrveni).
    
    Ukoliko user pokuša da kreira entry na time tracker stranici (klikom na Add u manual modu ili zaustavljanjem entrija u timer modu), 
    a da nekoliko required polja nije uneo, prikazuje se crveni toast u kojem je navedeno šta je sve required,
     a nije uneto, npr: “Can’t save, fields missing: project, task, tag, description, $CFName1, $CFName2” .
    
    Ukoliko user pokuša da edituje postojeći entry na time tracker stranici,
    koji je unet pre nego što je setovano da je neki CF required, 
    tada puštamo edit i u slučaju da je taj CF prazan. Jedino što ne dopuštamo je da se ukloni vrednost tog CF-a
    ako je postojala - u tom slučaju prikazujemo crveni toast “Can’t save, field missing: $CFName” 
    (prepisujemo logiku koju imamo za edit operaciju, za postojeća polja koja mogu da se označe kao
    required - projekat, task, tag, description).
    */
	function isCustomFieldRequired(cf, value) {
		if (cf.customFieldDto?.required) {
			if (typeof value === 'boolean') {
				return false;
			}

			if (!isInProgress) {
				if (!value || value.length === 0) {
					return false;
				}
				return true;
			}
			return true;
		}
		return false;
	}

	const validateCustomFields = ({ id, isValid }) => {
		setValidatedCustomFields((validatedCustomFields) => {
			return { ...validatedCustomFields, ...{ [id]: isValid } };
		});
	};

	useEffect(() => {
		let allFieldsValid = true;
		for (const [id, isValid] of Object.entries(validatedCustomFields)) {
			if (!isValid) {
				allFieldsValid = false;
			}
		}
		areCustomFieldsValid(allFieldsValid);
	}, [validatedCustomFields]);

	const onChangeProjectRedrawCustomFields = () => {
		const { projectId } = timeEntry;
		const { customFieldValues } = offlineStorage;
		if (!customFieldValues || customFieldValues.length === 0) return;

		// removes validated CFs when selected project is changed
		setValidatedCustomFields({});

		// na nivou projekta moze redefinisati vise od 5 VISIBLE polja,
		// dok na nivou WS ne vise od 5.
		const arr = [...customFields];
		arr.forEach((cf) => {
			if (
				!customFieldValues.find(
					(it) => it.customFieldId === cf.wsCustomField.id
				)
			) {
				if (cf.isVisible) {
					cf.isVisible = false;
				}
			}
		});

		customFieldValues.forEach((item) => {
			// hopefully we have no INACTIVE here
			let { customFieldDto: wsCustomField, value, timeEntryId, name } = item;
			if (!wsCustomField) {
				if (manualMode) {
				}
				wsCustomField = getWSCustomField(item.customFieldId);
			}
			if (manualMode) {
				value = wsCustomField.workspaceDefaultValue;
			}
			let status = wsCustomField.status;
			const { projectDefaultValues } = wsCustomField;
			if (projectDefaultValues && projectDefaultValues.length > 0) {
				const projectEntry = projectDefaultValues.find(
					(x) => x.projectId === projectId
				);
				if (projectEntry) {
					status = projectEntry.status;
					value = projectEntry.value;
				}
			}
			const cf = arr.find((it) => it.wsCustomField.id === wsCustomField.id);
			if (status === 'VISIBLE') {
				if (!cf) {
					// setCustomFields((prevState) => ([...prevState, { fields }]));
					arr.push({
						customFieldId: wsCustomField.id,
						wsCustomField,
						timeEntryId, // assert eq customField.timeEntryId
						value,
						index: arr.length,
						isUserOwnerOrAdmin,
						redrawCounter: 0,
						manualMode,
						isVisible: true,
					});
				} else {
					cf.wsCustomField = wsCustomField;
					cf.value = value;
					if (!cf.isVisible) cf.isVisible = true;
				}
			} else if (cf) {
				if (cf.isVisible) {
					cf.isVisible = false;
				}
			}
		});
		if (manualMode) {
			// maybe also  =>   || isOffline()
			const cfs =
				arr && arr.length > 0
					? arr.map(({ type, customFieldId, value }) => ({
							customFieldId,
							sourceType: 'TIMEENTRY',
							value: type === 'NUMBER' ? parseFloat(value) : value,
					  }))
					: [];
			updateCustomFields(cfs);
		}
		setCustomFields(arr);
	};
	return (
		<div className="custom-fields">
			{customFields
				.filter((cf) => cf.isVisible)
				.map((cf) => {
					const {
						wsCustomField: { id, type },
					} = cf;
					switch (type) {
						case 'TXT':
							return (
								<CustomFieldText
									key={id}
									cf={cf}
									updateValue={updateValue}
									isValid={validatedCustomFields[id]}
									setIsValid={validateCustomFields}
									cfContainsWrongChars={cfContainsWrongChars}
								/>
							);
						case 'NUMBER':
							return (
								<CustomFieldNumber
									key={id}
									cf={cf}
									updateValue={updateValue}
									numberFormat={workspaceSettings.numberFormat}
									isValid={validatedCustomFields[id]}
									setIsValid={validateCustomFields}
								/>
							);
						case 'LINK':
							return (
								<CustomFieldLink
									key={id}
									cf={cf}
									updateValue={updateValue}
									isValid={validatedCustomFields[id]}
									setIsValid={validateCustomFields}
									cfContainsWrongChars={cfContainsWrongChars}
								/>
							);
						case 'CHECKBOX':
							return (
								<CustomFieldCheckbox
									key={id}
									cf={cf}
									updateValue={updateValue}
									isValid={validatedCustomFields[id]}
									setIsValid={validateCustomFields}
								/>
							);
						case 'DROPDOWN_SINGLE':
							return (
								<CustomFieldDropSingle
									key={id}
									cf={cf}
									updateValue={updateValue}
									isValid={validatedCustomFields[id]}
									setIsValid={validateCustomFields}
								/>
							);
						case 'DROPDOWN_MULTIPLE':
							return (
								<CustomFieldDropMultiple
									key={id}
									cf={cf}
									updateValue={updateValue}
									isValid={validatedCustomFields[id]}
									setIsValid={validateCustomFields}
								/>
							);
						default:
							// TODO uncomment
							console.error('Uncovered custom field type: ' + type);
							return <CustomField key={id} cf={cf} />;
					}
				})}
		</div>
	);
}
