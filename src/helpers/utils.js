import React from 'react';
import Login from '../components/login.component';

export const logout = (reason, data) => {
	if (!document.getElementById('mount')) return;
	window.reactRoot.render(
		<Login logout={{ isTrue: true, reason: reason, data: data }} />
	);
};

export const isLoggedIn = async () => {
	const token = await localStorage.getItem('token');
	return token !== null && token !== undefined;
};

// Debounce function calls
// if you want the first call to be immediate, set isImmediate to true
// otherwise, the last call will be the one that is executed
export const debounce = ({ func, delay, isImmediate }) => {
	let timeout;
	return function () {
		const context = this,
			args = arguments;
		const later = function () {
			timeout = null;
			if (!isImmediate) func.apply(context, args);
		};
		const callNow = isImmediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, delay);
		if (callNow) func.apply(context, args);
	};
};

export 	const getRequiredMissingCustomFields = async (project, timeEntry) => {
	const requiredAndMissingCustomFields = [];

	const wsCustomFieldsFromStorage = await localStorage.getItem('wsCustomFields');
	const wsCustomFields = wsCustomFieldsFromStorage ? JSON.parse(wsCustomFieldsFromStorage) : [];
	const visibleCustomFieldsForAllProjects = wsCustomFields.filter(customField => customField.status === 'VISIBLE');

	let customFieldsForTimeEntry;
	if (project) {
		const visibleCustomFieldsForThisProject = [];
		wsCustomFields.forEach(customField => {
			customField.projectDefaultValues.forEach(projectDefaultValue => {
				if (projectDefaultValue.projectId === project.id && projectDefaultValue.status === 'VISIBLE') {
					visibleCustomFieldsForThisProject.push(customField);
				}
			});
		});

		const concatenatedCustomFields = [...visibleCustomFieldsForAllProjects, ...visibleCustomFieldsForThisProject];
		let visibleCustomFields = [];
		let ids = new Set();
		for (let field of concatenatedCustomFields) {
			if (!ids.has(field.id)) {
				ids.add(field.id);
				visibleCustomFields.push(field);
			}
		}
		const invisibleCustomFieldsForThisProject = [];
		if (project) {
			wsCustomFields.forEach(customField => {
				customField.projectDefaultValues.forEach(projectDefaultValue => {
					if (projectDefaultValue.projectId === project.id && projectDefaultValue.status === 'INVISIBLE') {
						invisibleCustomFieldsForThisProject.push(customField);
					}
				});
			});
		}
		customFieldsForTimeEntry = visibleCustomFields.filter(fieldVisible =>
			!invisibleCustomFieldsForThisProject.some(fieldInvisible =>
				fieldInvisible.id === fieldVisible.id));
	} else {
		customFieldsForTimeEntry = visibleCustomFieldsForAllProjects;
	}
	const requiredCustomFieldsForTimeEntry = customFieldsForTimeEntry.filter(
		customField => customField.required === true
	)
	if (requiredCustomFieldsForTimeEntry) {
		for (let requiredField of requiredCustomFieldsForTimeEntry) {
			let matchingField = timeEntry.customFieldValues.find(field =>
				field.customFieldId === requiredField.id);
			if (matchingField && matchingField.type !== "CHECKBOX" && !matchingField.value) {
				requiredAndMissingCustomFields.push(matchingField)
			}
		}
	}

	return requiredAndMissingCustomFields;
}