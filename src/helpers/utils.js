import React from 'react';
import Login from '../components/login.component';
import locales from './locales';
import { getWSCustomFields } from './offlineStorage';
const lodash = require('lodash');

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

export const getAllCustomFieldsForProject = async (project) => {
	const { data } = await getWSCustomFields();

	let allCustomFieldsForProject;

	const wsCustomFieldsFromStorage = await localStorage.getItem(
		'wsCustomFields'
	);
	const wsCustomFields = data
		? data
		: wsCustomFieldsFromStorage
		? JSON.parse(wsCustomFieldsFromStorage)
		: [];
	const visibleCustomFieldsForAllProjects = wsCustomFields.filter(
		(customField) => customField.status === 'VISIBLE'
	);

	if (project) {
		const visibleCustomFieldsForThisProject = [];
		wsCustomFields.forEach((customField) => {
			customField.projectDefaultValues.forEach((projectDefaultValue) => {
				if (
					projectDefaultValue.projectId === project.id &&
					projectDefaultValue.status === 'VISIBLE'
				) {
					visibleCustomFieldsForThisProject.push(customField);
				}
			});
		});

		const concatenatedCustomFields = [
			...visibleCustomFieldsForAllProjects,
			...visibleCustomFieldsForThisProject,
		];
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
			wsCustomFields.forEach((customField) => {
				customField.projectDefaultValues.forEach((projectDefaultValue) => {
					if (
						projectDefaultValue.projectId === project.id &&
						projectDefaultValue.status === 'INVISIBLE'
					) {
						invisibleCustomFieldsForThisProject.push(customField);
					}
				});
			});
		}
		allCustomFieldsForProject = visibleCustomFields.filter(
			(fieldVisible) =>
				!invisibleCustomFieldsForThisProject.some(
					(fieldInvisible) => fieldInvisible.id === fieldVisible.id
				)
		);
	} else {
		allCustomFieldsForProject = visibleCustomFieldsForAllProjects;
	}
	return allCustomFieldsForProject;
};

export const getRequiredMissingCustomFields = async (project, timeEntry) => {
	const requiredAndMissingCustomFields = [];
	const allCustomFieldsForProject = await getAllCustomFieldsForProject(project);

	const requiredCustomFieldsForTimeEntry = allCustomFieldsForProject.filter(
		(customField) => customField.required === true
	);
	if (requiredCustomFieldsForTimeEntry) {
		for (let requiredField of requiredCustomFieldsForTimeEntry) {
			let matchingField = timeEntry.customFieldValues.find(
				(field) => field.customFieldId === requiredField.id
			);
			if (
				matchingField &&
				matchingField.type !== 'CHECKBOX' &&
				((matchingField.type !== 'NUMBER' &&
					(!matchingField.value || !matchingField.value.length)) ||
					(matchingField.type === 'NUMBER' &&
						matchingField.value !== 0 &&
						!matchingField.value))
			) {
				requiredAndMissingCustomFields.push(matchingField);
			}
			if (requiredField && matchingField === undefined) {
				requiredAndMissingCustomFields.push(requiredField);
			}
		}
	}
	return requiredAndMissingCustomFields;
};

export const getRequiredAndMissingCustomFieldNames = async (
	project,
	timeEntry
) => {
	const requiredAndMissingCustomFields = await getRequiredMissingCustomFields(
		project,
		timeEntry
	);
	const requiredAndMissingCustomFieldNames = [];
	requiredAndMissingCustomFields.forEach((customField) => {
		requiredAndMissingCustomFieldNames.push(customField.name);
	});
	return requiredAndMissingCustomFieldNames;
};

export const getRequiredAndMissingFieldNames = (
	timeEntry,
	workspaceSettings
) => {
	const requiredAndMissingFieldNames = [];

	const {
		forceDescription,
		forceProjects,
		forceTags,
		forceTasks,
		projectLabel,
		taskLabel,
	} = workspaceSettings;

	if (forceProjects && !timeEntry.project) {
		requiredAndMissingFieldNames.push(
			projectLabel === 'project'
				? locales.PROJECT.toLowerCase()
				: projectLabel.toLowerCase()
		);
	}
	if (forceTasks && !timeEntry.task) {
		requiredAndMissingFieldNames.push(
			taskLabel === 'task'
				? locales.TASK.toLowerCase()
				: taskLabel.toLowerCase()
		);
	}
	if (forceTags && !timeEntry.tags.length) {
		requiredAndMissingFieldNames.push(locales.TAG.toLowerCase());
	}
	if (forceDescription && !timeEntry.description) {
		requiredAndMissingFieldNames.push(locales.DESCRIPTION_LABEL.toLowerCase());
	}

	return requiredAndMissingFieldNames;
};

export const areArraysSimilar = (array1, array2) => {
	if (array1.length !== array2.length) {
		return false;
	}

	const sortedArray1 = lodash.sortBy(array1, 'name');
	const sortedArray2 = lodash.sortBy(array2, 'name');

	return lodash.isEqual(sortedArray1, sortedArray2);
};
