import React, { useEffect, useState } from 'react';
import locales from '~/helpers/locales';
import { ColorPickerItem } from '~/components/ColorPicker/ColorPickerItem.tsx';

interface PropsInterface {
	selectedColor: Function;
}

const colors: string[] = [
	'#F44336',
	'#E91E63',
	'#9C27B0',
	'#673AB7',
	'#3F51B5',
	'#00BCD4',
	'#009688',
	'#4CAF50',
	'#8BC34A',
	'#FFC107',
	'#FF9800',
	'#FF5722',
	'#795548',
	'#607D8B',
];

const getRandomNumber = (min: number, max: number): number => {
	min = Math.ceil(min);
	max = Math.floor(max);

	return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const ColorPicker = (props: PropsInterface) => {
	const [selectedColor, setSelectedColor] = useState(
		colors[getRandomNumber(0, colors.length)],
	);

	useEffect(() => {
		props.selectedColor(selectedColor);
	}, []);

	const selectColor = (color: string): void => {
		props.selectedColor(color);
		setSelectedColor(color);
	};

	return (
		<div className="color-picker">
			<span className="color-picker__title">{locales.SELECT_COLOR}</span>
			<div className="color-picker__container">
				{colors.map((color: string) => (
					<ColorPickerItem
						key={color}
						color={color}
						onSelectColor={selectColor}
						selectedColor={selectedColor}
					/>
				))}
			</div>
		</div>
	);
};
