import * as React from 'react';
import { MouseEvent, useEffect, useRef, useState } from 'react';
import locales from '../../helpers/locales';
import { onClickOutside } from '~/helpers/onClickOutside';

type key = { label: string; localizationKey: string };

interface SingleSelectDropdownProps {
	updateValue: ({ label, localizationKey }: key) => void;
	labelProps: object;
	label: string;
	selectedValue: key;
	defaultValue: key;
	dropdownClassList: string;
	items: key[];
	error: boolean;
}

function SingleSelectDropdown(props: SingleSelectDropdownProps): React.JSX.Element {
	const {
		updateValue,
		labelProps,
		label,
		selectedValue,
		defaultValue,
		dropdownClassList,
		items,
		error,
	} = props;

	const [isOpen, setIsOpen] = useState<boolean>(false);

	useEffect(() => {
		const isSelectedValueSet = selectedValue && selectedValue.localizationKey;
		const isDefaultValueSet = defaultValue && defaultValue.localizationKey;

		if (!isSelectedValueSet && isDefaultValueSet) {
			updateValue(defaultValue);
		}
	});

	const singleSelectDropdownContainerRef = useRef<HTMLDivElement>(null);

	onClickOutside(singleSelectDropdownContainerRef, () => setIsOpen(false));

	function selectItem(event: MouseEvent) {
		const { target } = event;

		const label = target.getAttribute('data-label');
		const localizationKey = target.getAttribute('data-localization-key');

		updateValue({ label, localizationKey });
	}

	const toggle = () => setIsOpen(!isOpen);

	const arrowUpIcon = (
		<svg
			className="single-select-dropdown__arrow-up-icon"
			xmlns="http://www.w3.org/2000/svg"
			width="40"
			height="40"
			viewBox="0 0 40 40"
			fill="currentColor">
			<mask
				id="mask0_17888_1629"
				style={{ maskType: 'alpha' }}
				maskUnits="userSpaceOnUse"
				x="0"
				y="0"
				width="40"
				height="40">
				<rect width="40" height="40" fill="currentColor" />
			</mask>
			<g mask="url(#mask0_17888_1629)">
				<path
					d="M28.3134 23.35C28.3134 23.5675 28.24 23.7557 28.093 23.9146C27.9461 24.0732 27.7548 24.1525 27.5193 24.1525H13.7409C13.5054 24.1525 13.3141 24.0719 13.1672 23.9108C13.0203 23.7494 12.9468 23.5611 12.9468 23.3458C12.9468 23.29 13.0319 23.1054 13.2022 22.7921L19.7955 16.1987C19.91 16.0846 20.0375 15.9975 20.178 15.9375C20.3189 15.8775 20.4697 15.8475 20.6305 15.8475C20.7916 15.8475 20.9423 15.8775 21.0826 15.9375C21.2229 15.9975 21.3503 16.0846 21.4647 16.1987L28.0589 22.7929C28.1364 22.8704 28.1982 22.9562 28.2443 23.0504C28.2904 23.1443 28.3134 23.2441 28.3134 23.35Z"
					fill="currentColor"
				/>
			</g>
		</svg>
	);
	const arrowDownIcon = (
		<svg
			className="single-select-dropdown__arrow-down-icon"
			xmlns="http://www.w3.org/2000/svg"
			width="40"
			height="40"
			viewBox="0 0 40 40"
			fill="currentColor">
			<mask
				id="mask0_17888_1622"
				style={{ maskType: 'alpha' }}
				maskUnits="userSpaceOnUse"
				x="0"
				y="0"
				width="40"
				height="40">
				<rect width="40" height="40" fill="currentColor" />
			</mask>
			<g mask="url(#mask0_17888_1622)">
				<path
					d="M26.798 17.2079L20.2047 23.8012C20.0902 23.9154 19.9627 24.0025 19.8222 24.0625C19.6814 24.1225 19.5305 24.1525 19.3697 24.1525C19.2086 24.1525 19.0579 24.1225 18.9176 24.0625C18.7773 24.0025 18.65 23.9154 18.5355 23.8012L11.9414 17.2071C11.8639 17.1296 11.802 17.0437 11.7559 16.9496C11.7098 16.8557 11.6868 16.7558 11.6868 16.65C11.6868 16.4325 11.7602 16.2443 11.9072 16.0854C12.0541 15.9268 12.2454 15.8475 12.4809 15.8475L26.2593 15.8475C26.4948 15.8475 26.6861 15.928 26.833 16.0891C26.98 16.2505 27.0534 16.4389 27.0534 16.6541C27.0534 16.71 26.9683 16.8946 26.798 17.2079Z"
					fill="currentColor"
				/>
			</g>
		</svg>
	);

	const requiredFieldParagraph = (
		<p className="required-field-message">{locales.FIELD_REQUIRED_VALIDATION}</p>
	);

	return (
		<form className={`single-select-dropdown ${dropdownClassList}`}>
			<label {...labelProps} className="single-select-dropdown__label">
				{label}
			</label>
			<div
				onClick={toggle}
				ref={singleSelectDropdownContainerRef}
				className="single-select-dropdown__dropdown-container">
				<span>{selectedValue.label || locales.SELECT_PLACEHOLDER}</span>
				{isOpen && (
					<ul className="single-select-dropdown__selection-list">
						{items.map(({ label, localizationKey }: key) => (
							<li
								key={localizationKey}
								data-label={label}
								data-localization-key={localizationKey}
								onClick={selectItem}
								className="single-select-dropdown__selection-item">
								{label}
							</li>
						))}
					</ul>
				)}
				{isOpen ? arrowUpIcon : arrowDownIcon}
			</div>
			{error && requiredFieldParagraph}
		</form>
	);
}

export default SingleSelectDropdown;
