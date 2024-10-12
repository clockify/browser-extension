import React, { useRef, useState } from 'react';
import { useOnClickOutside } from './customFields/useOnClickOutside';
import { TimeEntryDto } from '../DTOs/TimeEntryDto';

interface PropsInterface {
	renderInput: Function;
	value: '';
	onChange: VoidFunction;
	items: TimeEntryDto[];
	onSelect: Function;
}

export const Autocomplete = (props: PropsInterface): JSX.Element => {
	const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

	const menuRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useOnClickOutside(menuRef, () => setIsDropdownOpen(false));

	return (
		<div className="react-autocomplete">
			{props.renderInput({
				value: props.value || '',
				onChange: props.onChange,
				onClick: () => setIsDropdownOpen(true),
				autoComplete: 'off',
				ref: inputRef
			})}

			{isDropdownOpen && (
				<div ref={menuRef} className="react-autocomplete-menu">
					{props.items?.map((item) => (
						<div
							key={item.id}
							className={'autocomplete-dropdown-item'}
							onClick={() => {
								setIsDropdownOpen(false);
								props.onSelect(item);
							}}
						>
							{item.description && (
								<span className="autocomplete-dropdown-item__description">
									{item.description}
								</span>
							)}

							{item.project?.name && (
								<span
									className="autocomplete-dropdown-item__project-task"
									style={{ color: item.project?.color }}
								>
									<div
										className="dot"
										style={{ backgroundColor: item.project?.color }}
									/>
									<span>{item.project.name}</span>
									{item.task?.name && <span>{': ' + item.task.name}</span>}
								</span>
							)}

							{item.project?.clientName && (
								<span className="autocomplete-dropdown-item__client-name">
									{' - ' + item.project.clientName}
								</span>
							)}

							{item.tags?.length >= 1 && (
								<span className="autocomplete-dropdown-item__tag">
									{item.tags
										.slice(0, 3)
										.map((tag) => tag.name)
										.join(', ')}
									{item.tags.length > 3 ? '...' : ''}
								</span>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
};
