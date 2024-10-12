import React, { useEffect, useRef, useState } from 'react';

import CustomField from './customField';
import CustomFieldText from './customField-Text';
import CustomFieldNumber from './customField-Number';
import CustomFieldLink from './customField-Link';
import CustomFieldCheckbox from './customField-Checkbox';
import CustomFieldDropMultiple from './customField-DropMultiple';
import CustomFieldDropSingle from './customField-DropSingle';
import { getAllCustomFieldsForProject } from '../../helpers/utils';

export function CustomFieldsContainer({
																				timeEntry,
																				isUserOwnerOrAdmin,
																				manualMode,
																				updateCustomFields,
																				isInProgress,
																				areCustomFieldsValid,
																				workspaceSettings,
																				cfContainsWrongChars,
																				selectedProjectId
																			}) {
	const [customFields, setCustomFields] = useState([]);
	const [projectId, setProjectId] = useState(timeEntry.projectId);
	const [validatedCustomFields, setValidatedCustomFields] = useState({});
	const haveFieldsRenderedInitially = useRef(false);

	useEffect(() => {
		async function createCustomFieldsInitially() {
			await createCustomFields(true);
		}

		createCustomFieldsInitially();
	}, [isUserOwnerOrAdmin, timeEntry.id]);

	useEffect(() => {
		if (!haveFieldsRenderedInitially.current) return;
		const newProjectId = timeEntry.projectId || timeEntry.project?.id || selectedProjectId;
		if (projectId !== newProjectId) {
			setProjectId(newProjectId);

			async function onChangeProjectRedrawCustomFields() {
				await createCustomFields();
			}

			onChangeProjectRedrawCustomFields();
		}
	}, [selectedProjectId, timeEntry.projectId, timeEntry.project?.id]);

	const updateValue = (customFieldId, value) => {
		const cf = customFields.find((x) => x.customFieldId === customFieldId);
		cf.value = value;
		const arr = customFields.map(({ customFieldId, value }) => ({
			customFieldId,
			sourceType: 'TIMEENTRY',
			value
		}));
		if (manualMode) {
			updateCustomFields(arr);
		} else {
			updateCustomFields(arr);
		}
	};

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

	const createCustomFields = async (initialRender = false) => {
		const { projectId, project, customFieldValues } = timeEntry;
		const timeEntryId = timeEntry.id;

		const allCustomFieldsForProject = await getAllCustomFieldsForProject(project);
		if (!allCustomFieldsForProject || allCustomFieldsForProject.length === 0) return;

		const customFieldsToPutIntoState = [];
		allCustomFieldsForProject.forEach(customField => {
			let { value } = customField;
			const { projectDefaultValues } = customField;
			if (projectDefaultValues && projectDefaultValues.length > 0) {
				const defaultValueForTheProject = projectDefaultValues.find(
					(projectDefaultValue) => projectDefaultValue.projectId === projectId
				);
				if (defaultValueForTheProject) {
					value = defaultValueForTheProject.value;
				}
			}
			if (!value?.length && customField.workspaceDefaultValue) {
				value = customField.workspaceDefaultValue;
			}
			customFieldsToPutIntoState.push({
				customFieldId: customField.id,
				wsCustomField: customField,
				timeEntryId,
				value,
				index: customFieldsToPutIntoState.length,
				isUserOwnerOrAdmin,
				manualMode,
				isVisible: true,
				required: customField.required,
				randomizedId: Math.floor(Math.random() * 9000000) + 10000000
			});
		});
		if (manualMode) {
			const manualCustomFields =
				customFieldsToPutIntoState && customFieldsToPutIntoState.length > 0
					? customFieldsToPutIntoState.map(({ type, customFieldId, value }) => ({
						customFieldId,
						sourceType: 'TIMEENTRY',
						value: type === 'NUMBER' ? parseFloat(value) : value
					}))
					: [];
			updateCustomFields(manualCustomFields);
		}
		if (initialRender) {
			customFieldsToPutIntoState.forEach(fieldToPut => {
				const matchingField = customFieldValues.find(field => field.customFieldId === fieldToPut.customFieldId);
				if (matchingField && matchingField.value !== null && matchingField.value !== undefined) {
					fieldToPut.value = matchingField.value;
				}
			});

		}
		setCustomFields(customFieldsToPutIntoState);
		haveFieldsRenderedInitially.current = true;
	};
	return (
		<div className="custom-fields">
			{customFields
				.filter((cf) => cf.isVisible)
				.map((cf) => {
					const {
						wsCustomField: { id, type }
					} = cf;
					const { randomizedId } = cf;
					switch (type) {
						case 'TXT':
							return (
								<CustomFieldText
									key={`${id}-${randomizedId}`}
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
									key={`${id}-${randomizedId}`}
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
									projectId={projectId}
									key={`${id}-${randomizedId}`}
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
									key={`${id}-${randomizedId}`}
									cf={cf}
									updateValue={updateValue}
									isValid={validatedCustomFields[id]}
									setIsValid={validateCustomFields}
								/>
							);
						case 'DROPDOWN_SINGLE':
							return (
								<CustomFieldDropSingle
									key={`${id}-${randomizedId}`}
									cf={cf}
									updateValue={updateValue}
									isValid={validatedCustomFields[id]}
									setIsValid={validateCustomFields}
								/>
							);
						case 'DROPDOWN_MULTIPLE':
							return (
								<CustomFieldDropMultiple
									key={`${id}-${randomizedId}`}
									cf={cf}
									updateValue={updateValue}
									isValid={validatedCustomFields[id]}
									setIsValid={validateCustomFields}
								/>
							);
						default:
							console.error('Uncovered custom field type: ' + type);
							return <CustomField key={id} cf={cf} />;
					}
				})}
		</div>
	);
}
