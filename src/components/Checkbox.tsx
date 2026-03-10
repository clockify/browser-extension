import * as React from 'react';

interface CheckboxProps {
	label: string;
	classList: string;
	isChecked: boolean;
	setIsChecked: (bool: boolean) => void;
}

function Checkbox(props: CheckboxProps) {
	const { label, isChecked, setIsChecked, classList } = props;

	return (
		<form className={`checkbox ${classList ? classList : ''}`}>
			<input
				type="checkbox"
				id="checkbox"
				checked={isChecked}
				onChange={event => setIsChecked(event.target.checked)}
			/>
			<label htmlFor="checkbox">{label}</label>
		</form>
	);
}

export default Checkbox;
