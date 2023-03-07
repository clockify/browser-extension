import React, { useRef } from 'react';
import locales from '../helpers/locales';
import { useOnClickOutside } from './customFields/useOnClickOutside';

export default function TimeEntryDropdown(props) {
	const { onDelete, onDuplicate, toggleDropdown, manualModeDisabled } = props;
	const menuRef = useRef(null);
	useOnClickOutside(menuRef, () => toggleDropdown());

	return (
		<div className="time-entry-menu__dropdown" ref={menuRef}>
			<ul className="time-entry-menu__dropdown-menu dropdown-menu">
				{!manualModeDisabled && (
					<li
						onClick={(e) => {
							onDuplicate(e);
						}}
						className="time-entry-menu__dropdown-menu-item dropdown-item"
					>
						{locales.DUPLICATE}
					</li>
				)}
				<li
					onClick={(e) => {
						onDelete(e);
					}}
					className="time-entry-menu__dropdown-menu-item dropdown-item"
				>
					{locales.DELETE}
				</li>
			</ul>
		</div>
	);
}
