import React from 'react';

interface PropsInterface {
	clientName: string;
	onClientSelect: VoidFunction;
}

export const ClientListItem = (props: PropsInterface) => {
	return (
		<div>
			<div className="client-list-client" onClick={props.onClientSelect}>
				{props.clientName}
			</div>
		</div>
	);
};
