import React, { MouseEventHandler, useRef } from 'react';
import locales from '~/helpers/locales';
import { onClickOutside } from '~/helpers/onClickOutside';

interface PropsInterface {
	onDelete: MouseEventHandler;
	onDuplicate: MouseEventHandler;
	toggleDropdown: VoidFunction;
	manualModeDisabled: boolean;
}

export const TimeEntryDropdown = (props: PropsInterface) => {
	const menuRef = useRef(null);

	onClickOutside(menuRef, () => props.toggleDropdown());

	return (
		<div className="time-entry-menu__dropdown" ref={menuRef}>
			<ul className="time-entry-menu__dropdown-menu dropdown-menu">
				{!props.manualModeDisabled && (
					<li
						onClick={props.onDuplicate}
						className="time-entry-menu__dropdown-menu-item dropdown-item">
						{locales.DUPLICATE}
					</li>
				)}
				<li
					onClick={props.onDelete}
					className="time-entry-menu__dropdown-menu-item dropdown-item">
					{locales.DELETE}
				</li>
			</ul>
		</div>
	);
};
