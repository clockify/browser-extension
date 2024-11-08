import React, { useState, useEffect, useRef } from 'react';
import useCustomField from './useCustomField';
import locales from '../../helpers/locales';
import { getBrowser } from '../../helpers/browser-helper';
import { useOnClickOutside } from './useOnClickOutside';

const CustomFieldDropSingle = ({ cf, updateValue, setIsValid }) => {
	const [value, setValue] = useState(cf.value);
	const menuRef = useRef(null);

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

	const newList = (val) => {
		const items = allowedValues.map((name, id) => ({
			id,
			name,
			isChecked: val === name,
		}));
		items.unshift({ id: -1, name: locales.NONE, isChecked: val === null });
		return items;
	};

	const [isOpen, setOpen] = useState(false);

	const [tagList, setTagList] = useState(allowedValues ? newList(value) : []);

	useEffect(() => {
		storeValue();
	}, [value])

	useEffect(() => {
		setTagList(newList(value));
	}, [value]);


	useOnClickOutside(menuRef, () => setOpen(false));

	const tagsRequired = false;

	const selectTag = (tagId) => {
		const tag = tagList.find((t) => t.id === tagId);
		const val = tagId === -1 ? null : tag.name;
		setValue(val);
		storeValue(val);
		manualMode && updateValue(id, val);
		// handleChangeDelayed.current(val);
		setOpen(false);
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

	const isNotValid = required && !value;

	useEffect(() => {
		setIsValid({ id: id, isValid: !(required && !value) });
	}, [value]);

	return (
		<>
			<div
				key={id}
				index={index}
				className={`custom-field${isDisabled ? '-disabled' : ''}`}
			>
				<div data-testid={'single-select-option'}
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
						}`}
						onClick={toggleTagList}
						tabIndex={'0'}
						onKeyDown={(e) => {
							if (e.key === 'Enter') toggleTagList(e);
						}}
					>
						<span className="tag-list-name">
							{value ? (
								<span className={'tag-list-selected'}>
									{tagList
										.filter((tag) => tag.isChecked)
										.map((tag) => (
											<span key={tag.id} className="tag-list-selected-item">
												{tag.name}
											</span>
										))}
								</span>
							) : (
								<span className="tag-list-add">{placeHolder}</span>
							)}
						</span>

						<span
							className={isOpen ? `tag-list-arrow-up` : `tag-list-arrow`}
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
											// <div
											//     <span value={tag.name} className="tag-list-item">
											//         {tag.name}
											//     </span>
											// </div>
											<div
												onClick={() => selectTag(tag.id)}
												key={tag.name}
												tabIndex={'0'}
												onKeyDown={(e) => {
													if (e.key === 'Enter') selectTag(tag.id);
												}}
												className="tag-list-item-row"
											>
												<label className="cf-container">
													{tag.name}
													{tag.isChecked && (
														<input
															type="radio"
															checked
															name="cf_radio"
															onChange={() => {}}
														/>
													)}
													{!tag.isChecked && (
														<input type="radio" name="cf_radio" />
													)}
													<span className="checkmark"></span>
												</label>
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

export default CustomFieldDropSingle;
