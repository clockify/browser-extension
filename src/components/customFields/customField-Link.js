import React, { useState, useRef, useEffect } from 'react';
import useCustomField from './useCustomField';
import { getBrowser } from '~/helpers/browser-helper';
import locales from '../../helpers/locales';
import { LINK_REGEX } from '~/helpers/utils';
import Toaster from '../toaster-component';

const CustomFieldLink = ({ cf, updateValue, setIsValid, projectId }) => {
	const [value, setValue] = useState(cf.value);
	const [backupValue, setBackUpValue] = useState(cf.value);
	const [previewMode, setPreviewMode] = useState(!!cf.value);
	const toasterRef = useRef(null);

	const [
		{ id, index, isDisabled, placeHolderOrName, manualMode, required, description },
		storeValue,
	] = useCustomField(cf, updateValue, value);

	const isNotValid = required && !value;

	useEffect(() => {
		setIsValid({ id: id, isValid: !isNotValid });
		storeValue();
	}, []);

	useEffect(() => {
		updateValue(id, cf.value);
	}, [cf.value]);

	useEffect(() => {
		setValue(cf.value);
	}, [projectId]);

	const onLinkChange = event => {
		const link = event.target.value;
		setValue(link);
	};

	const onLinkBlur = () => {
		if (!value && !required) {
			setValue(value);
			setBackUpValue(value);
			storeValue(value);
			updateValue(id, '');
			return;
		}

		let updatedLink;
		if (value && (value.startsWith('http://') || value.startsWith('https://'))) {
			updatedLink = value;
		} else {
			updatedLink = `https://${value}`;
		}

		if (LINK_REGEX.test(updatedLink)) {
			setValue(updatedLink);
			setBackUpValue(updatedLink);
			storeValue(updatedLink);
			updateValue(id, updatedLink);
			setPreviewMode(true);
			setIsValid({ id: id, isValid: true });
		} else {
			setValue(backupValue);
			if (!backupValue) {
				setIsValid({ id: id, isValid: !required });
			}
			if (toasterRef.current) {
				toasterRef.current.toast('error', locales.WEBSITE_FORMAT_ERROR, 3);
			}
		}
	};

	return (
		<>
			<Toaster ref={toasterRef} />
			<div className={`custom-field${isDisabled ? '-disabled' : ''}`}>
				{previewMode ? (
					<div className={`custom-field-inner${isDisabled ? '-disabled' : ''}`}>
						<a
							href={value}
							style={{ color: '#03a9f4', fontSize: '14px' }}
							target="_blank"
							title={description}>
							{!!value ? value : description}
						</a>
						{!isDisabled && (
							<img
								title={description}
								src={getBrowser().runtime.getURL('assets/images/edit-unsynced.png')}
								style={{
									marginLeft: '8px',
									width: '14px',
									height: '14px',
									cursor: 'pointer',
								}}
								className={isDisabled ? '' : 'clockify-close-dlg-icon'}
								onClick={() => setPreviewMode(false)}
							/>
						)}
					</div>
				) : (
					<input
						name={`txtCustomField${index}`}
						type="url"
						className={`custom-field-link clockify-link-input${
							isDisabled ? '-disabled' : ''
						} ${isNotValid ? 'custom-field-required' : ''}`}
						title={description}
						placeholder={placeHolderOrName}
						onChange={onLinkChange}
						onBlur={onLinkBlur}
						disabled={isDisabled}
						value={value || ''}
					/>
				)}
			</div>
		</>
	);
};

export default CustomFieldLink;
