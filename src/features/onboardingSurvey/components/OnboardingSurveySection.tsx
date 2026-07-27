import React, { useRef, useState } from 'react';
import { IOnboardingSurveyOption } from '~/features/onboardingSurvey/types/onboardingSurveyOption.interface';
import { onClickOutside } from '~/helpers/onClickOutside';

interface IProps {
	options: IOnboardingSurveyOption[];
	label: string;
	defaultOptionLabel: string;
	onSelect: Function;
	dropdownDirection?: 'top' | 'bottom';
}

export const OnboardingSurveySection = ({
	options,
	label,
	defaultOptionLabel,
	onSelect,
	dropdownDirection = 'bottom',
}: IProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [selected, setSelected] = useState<IOnboardingSurveyOption>();

	const ref = useRef();

	onClickOutside(ref, () => setIsOpen(false));

	const handleSelect = (option: IOnboardingSurveyOption) => {
		setSelected(option);
		onSelect(option.localizationKey);
		setIsOpen(false);
	};

	return (
		<div className={'onboarding-survey-content-section'}>
			<span>{label}</span>

			<div className={`dropdown ${isOpen ? 'is-open' : ''}`} ref={ref}>
				<div className="dropdown-header" onClick={() => setIsOpen(!isOpen)}>
					<span>{selected ? selected.label : defaultOptionLabel}</span>
					<i className="arrow"></i>
				</div>

				{isOpen && (
					<ul className={`dropdown-list dropdown-list-${dropdownDirection}`}>
						{options.map(option => (
							<li
								key={option.localizationKey}
								onClick={() => handleSelect(option)}
								className={
									selected?.localizationKey === option.localizationKey
										? 'dropdown-list-selected-item'
										: ''
								}>
								{option.label}
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
};
