import React from 'react';

interface PropsInterface {
	color: string;
	onSelectColor: Function;
	selectedColor: string;
}

export const ColorPickerItem = (props: PropsInterface) => {
	return (
		<div
			className="color-picker__color_box"
			style={{ background: props.color }}
			onClick={() => props.onSelectColor(props.color)}
		>
			<img
				src="./assets/images/checked.png"
				className={
					props.selectedColor === props.color
						? 'color-picker__billable-img'
						: 'color-picker__billable-img-hidden'
				}
			/>
		</div>
	);
};
