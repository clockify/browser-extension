import * as React from 'react';
import locales from '~/helpers/locales';
import { TimeEntryFullDto } from '~/DTOs/TimeEntryFullDto.ts';

interface PropsInterface {
	askToDeleteEntry: boolean;
	confirmed: VoidFunction;
	canceled: VoidFunction;
	multiple?: TimeEntryFullDto[];
}

export const DeleteEntryConfirmation = (
	props: PropsInterface
): React.JSX.Element => {
	if (!props.askToDeleteEntry) return;

	return (
		<div className="delete-entry-confirmation-dialog-open">
			<div className="delete-entry-confirmation-dialog">
				<span className="delete-entry-confirmation-dialog__question">
					{props.multiple?.length > 1
						? locales.DELETE_MULTIPLE_ENTRIES(props.multiple.length)
						: locales.ARE_YOU_SURE_DELETE}
				</span>
				<span
					onClick={props.confirmed}
					className="delete-entry-confirmation-dialog__confirmation_button"
				>
					{locales.DELETE}
				</span>
				<span
					onClick={props.canceled}
					className="delete-entry-confirmation-dialog__cancel"
				>
					{locales.CANCEL}
				</span>
			</div>
		</div>
	);
};
