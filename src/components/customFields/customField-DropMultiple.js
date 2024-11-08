import React, { useState, useEffect, useRef } from 'react';
import useCustomField from './useCustomField';
import { isOffline } from '../check-connection';
import locales from '../../helpers/locales';
import { useOnClickOutside } from './useOnClickOutside';
import { getBrowser } from '../../helpers/browser-helper';

const hasValue = (array) => Array.isArray(array) && array.length;

const CustomFieldDropMultiple = ({ cf, updateValue, setIsValid }) => {
	if (!cf.value) cf.value = [];

	const [value, setValue] = useState(cf.value);

	const menuRef = useRef(null);
	const isMounted = useRef(false);
	const [
		{
			id,
			index,
			isDisabled,
			placeHolder,
			allowedValues,
			manualMode,
			required,
			name,
			description,
		},
		storeValue,
	] = useCustomField(cf, updateValue, value);

	const newList = (val = '') =>
		allowedValues.map((name, id) => ({
			id,
			name,
			isChecked: val.includes(name),
		}));

	const [isOpen, setOpen] = useState(false);

	const [tagList, setTagList] = useState(allowedValues ? newList(value) : []);

	useEffect(() => {
		storeValue();
	}, [value])

	useEffect(() => {
		setValue(cf.value);
	}, [cf.value]);

	useEffect(() => {
		setTagList(newList(value));
		setIsValid({ id: id, isValid: !(required && !hasValue(value)) });
	}, [value]);

	useOnClickOutside(menuRef, () => setOpen(false));

	const tagsRequired = false;

	const hanldeChange = async () => {
		const isOff = await isOffline();
		if (!(manualMode || isOff)) {
			storeValue();
		}
	};

	useEffect(() => {
		if (isMounted.current) {
			if (!isOpen && !isDisabled) {
				hanldeChange();
			}
		} else {
			isMounted.current = true;
		}
	}, [isOpen]);

	const selectTag = (tagId) => {
		const tag = tagList.find((t) => t.id === tagId);
		const val = value.includes(tag.name)
			? value.filter((name) => name !== tag.name)
			: [...value, tag.name];
		setValue(val);
		manualMode && updateValue(id, val);
		// handleChangeDelayed.current(val);
	};

	const toggleTagList = (e) => {
		e.stopPropagation();
		if (!isDisabled) {
			const x = !isOpen;
			setOpen(x);
		}
	};

	const _encode_chars = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&apos;',
	};

	const encoded = (name) => {
		const arr = [...name].map((c) => (_encode_chars[c] ? _encode_chars[c] : c));
		return arr.join('');
	};

	const noMatcingItems = locales.NO_MATCHING('items');
	const isNotValid = required && !hasValue(value);

	return (
		<>
			<div
				index={index}
				className={`custom-field${isDisabled ? '-disabled' : ''}`}
			>
				<div data-testid={'multiple-select-option'}
					className={`tag-list ${isNotValid ? 'custom-field-required' : ''}`}
					title={description}
					ref={menuRef}
				>
					<div
						className={`${
							isDisabled
								? 'tag-list-button-disabled'
								: tagsRequired
								? 'tag-list-button-required'
								: 'tag-list-button'
						} 
                            `}
						onClick={toggleTagList}
						tabIndex={'0'}
						onKeyDown={(e) => {
							if (e.key === 'Enter') toggleTagList(e);
						}}
					>
						<span className="tag-list-name">
							{value?.length > 0 ? (
								<span className={'tag-list-selected'}>
									{tagList
										.filter((tag) => tag.isChecked)
										.map((tag, index, list) => (
											<span key={tag.id} className="tag-list-selected-item">
												{tag.name}
												{index < list.length - 1 ? ',' : ''}
											</span>
										))}
								</span>
							) : (
								<span className="tag-list-add">{placeHolder}</span>
							)}
						</span>

						<span
							className={isOpen ? 'tag-list-arrow-up' : 'tag-list-arrow'}
							style={{
								content: `url(${getBrowser().runtime.getURL(
									'assets/images/' +
										(isOpen
											? 'arrow-light-mode-up.png'
											: 'arrow-light-mode.png')
								)})`,
							}}
						></span>
					</div>
					<div
						id="tagListDropdown"
						className={isOpen ? 'tag-list-dropdown' : 'disabled'}
					>
						<div className="tag-list-dropdown--content">
							<div className="tag-list-items">
								{tagList.length > 0 ? (
									tagList.map((tag) => {
										return (
											<div
												onClick={() => selectTag(tag.id)}
												key={tag.id}
												tabIndex={'0'}
												onKeyDown={(e) => {
													if (e.key === 'Enter') selectTag(tag.id);
												}}
												className="tag-list-item-row"
											>
												<span
													value={tag.name}
													className={
														tag.isChecked
															? 'tag-list-checkbox checked'
															: 'tag-list-checkbox'
													}
												>
													<img
														src={getBrowser().runtime.getURL(
															'assets/images/checked.png'
														)}
														value={tag.name}
														className={
															tag.isChecked
																? 'tag-list-checked'
																: 'tag-list-checked-hidden'
														}
													/>
												</span>
												<span data-testid={'multiple-select-option-item'}
													value={tag.name} className="tag-list-item">
													{tag.name}
												</span>
											</div>
										);
									})
								) : (
									<span className="tag-list--not_tags">{noMatcingItems}</span>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{isNotValid && (
				<p className="field-required-message">
					*{cf.wsCustomField.name} {locales.FIELD_REQUIRED}
				</p>
			)}
		</>
	);
};

export default CustomFieldDropMultiple;
