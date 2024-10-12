import React, { useEffect, useRef, useState } from 'react';
import useCustomField from './useCustomField';
import { useOnClickOutside } from './useOnClickOutside';
import { getBrowser } from '../../helpers/browser-helper';
import locales from '../../helpers/locales';

const CustomFieldLink = ({
													 cf,
													 updateValue,
													 setIsValid,
													 cfContainsWrongChars,
													 projectId
												 }) => {
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
			required,
			description
		},
		storeValue
	] = useCustomField(cf, updateValue, value);


	const [valueTemp, setValueTemp] = useState(null);
	const handleChangeTemp = (e) => {
		const val = e.target.value;
		setValueTemp(val);
	};

	const [valueStay, setValueStay] = useState(value);
	const handleChangeStay = (e) => {
		const val = e.target.value;
		setIsValid({ id: id, isValid: !(required && !val.trim()) });
		setValueStay(val);
		const pattern = /<[^>]+>/;
		const isCustomFieldContainsWrongChars = pattern.test(val);
		cfContainsWrongChars({ id, isCustomFieldContainsWrongChars });
		storeValue(val);
	};

	const storeStay = (e) => {
		e.stopPropagation();

		if (!e.target.value.trim()) {
			setValueStay('');
			setValue('');
			setValueTemp('');

			return;
		}

		let valueToSave;
		if (valueStay.startsWith('http://') || valueStay.startsWith('https://')) {
			valueToSave = valueStay;
		} else {
			valueToSave = `https://${valueStay}`;
		}
		setValue(valueToSave);
		manualMode && updateValue(id, valueToSave);
		setValueStay(valueToSave);
	};

	const [isModalOpen, setModalOpen] = useState(false);

	const ref = useRef();
	// Call hook passing in the ref and a function to call on outside click
	useOnClickOutside(ref, () => setModalOpen(false));

	const openModal = () => {
		setValueTemp(value);
		setModalOpen(true);
	};

	const closeModal = () => {
		setModalOpen(false);
	};

	const saveModal = () => {
		if (!valueTemp || value === valueTemp) {
			return;
		}
		let valueToSave;
		if (valueTemp.startsWith('http://') || valueTemp.startsWith('https://')) {
			valueToSave = valueTemp;
		} else {
			valueToSave = `https://${valueTemp}`;
		}
		setValue(valueToSave);
		setValueStay(valueToSave);
		updateValue(id, valueToSave);
		storeValue(valueToSave);
		setModalOpen(false);

		const pattern = /<[^>]+>/;
		const isCustomFieldContainsWrongChars = pattern.test(valueTemp);
		cfContainsWrongChars({ id, isCustomFieldContainsWrongChars });
	};

	const isNotValid = required && !value?.trim();

	useEffect(() => {
		storeValue();
	}, [value]);

	useEffect(() => {
		setValue(cf.value);
	}, [cf.value]);

	useEffect(() => {
		setIsInputValid();
	}, [value]);

	useEffect(() => {
		if (value === undefined) setValueStay('');
	}, [value]);

	useEffect(() => {
		setValue(cf.value);
		setValueTemp(cf.value);
		setValueStay(cf.value);
		setIsInputValid();
	}, [projectId]);

	const setIsInputValid = () => {
		setIsValid({ id: id, isValid: !(required && !value?.trim()) });
	};


	return (
		<>
			<div>
				<div
					key={id}
					index={index}
					className={`custom-field${isDisabled ? '-disabled' : ''}`}
				>
					{value ? (
						<div
							className={`custom-field-inner${isDisabled ? '-disabled' : ''}`}
						>
							<a
								href={value}
								style={{ color: '#03a9f4', fontSize: '14px' }}
								target="_blank"
								title={description}
							>
								{!!valueStay ? valueStay : description}
							</a>
							{!isDisabled && (
								<img
									index={index}
									title={description}
									src={getBrowser().runtime.getURL(
										'assets/images/edit-unsynced.png'
									)}
									style={{
										marginLeft: '8px',
										width: '14px',
										height: '14px',
										cursor: 'pointer'
									}}
									className={isDisabled ? '' : 'clockify-close-dlg-icon'}
									onClick={() => openModal()}
								/>
							)}
						</div>
					) : (
						<input
							name={`txtCustomField${index}`}
							type="url"
							index={index}
							className={`custom-field-link clockify-link-input${
								isDisabled ? '-disabled' : ''
							} ${isNotValid ? 'custom-field-required' : ''}`}
							title={description}
							placeholder={placeHolderOrName}
							onChange={handleChangeStay}
							onBlur={storeStay}
							disabled={isDisabled}
							value={!!valueStay ? valueStay : ''}
						/>
					)}
				</div>

				{isModalOpen && (
					<div id="divClockifyLinkModal" className="clockify-modal">
						<div className="clockify-modal-content" ref={ref}>
							<div className="cl-modal-header">
								<h1 className="cl-modal-title">Edit link</h1>
								<button type="button" className="cl-close" onClick={closeModal}>
									<span aria-hidden="true">
										<span className="clockify-close"></span>
									</span>
								</button>
							</div>
							<div className="cl-modal-body">
								<div className="custom-field-link-label">
									{placeHolderOrName}
								</div>
								<input
									type="url"
									className="custom-field-link clockify-link-input-modal"
									placeholder={placeHolderOrName}
									autoComplete="off"
									onChange={handleChangeTemp}
									value={!!valueTemp ? valueTemp : ''}
								/>
							</div>
							<div className="cl-modal-footer">
								<a className="clockify-cancel" onClick={closeModal} disabled="">
									{locales.CANCEL}
								</a>
								<a
									className={`clockify-save${
										!valueTemp || value === valueTemp
											? ' clockify-save--disabled'
											: ''
									}`}
									onClick={saveModal}
									disabled=""
								>
									SAVE
								</a>
							</div>
						</div>
					</div>
				)}
			</div>
			{isNotValid && (
				<p className="field-required-message">
					*{cf.wsCustomField.name} {locales.FIELD_REQUIRED}
				</p>
			)}
		</>
	);
};

export default CustomFieldLink;
