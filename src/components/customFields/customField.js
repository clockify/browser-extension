import React from 'react';

const CustomField = ({ obj }) => {
	const { wsCustomField, timeEntryId, value, index } = obj;
	const { id, name, type } = wsCustomField;
	return (
		<div key={id} index={index} className="custom-field">
			{id} , {type} , {name} , {index}
		</div>
	);
};

export default CustomField;
