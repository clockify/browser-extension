import * as React from 'react';
import locales from '../helpers/locales';

const colorList = [
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

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

class ColorPicker extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			selectedColor: colorList[getRandomInt(0, colorList.length)],
		};
	}

	componentDidMount() {
		this.props.selectedColor(this.state.selectedColor);
	}

	selectColor(event) {
		const color = JSON.parse(event.target.getAttribute('value'));
		this.props.selectedColor(JSON.parse(event.target.getAttribute('value')));

		this.setState({
			selectedColor: JSON.parse(event.target.getAttribute('value')),
		});
	}

	render() {
		return (
			<div className="color-picker">
				<span className="color-picker__title">{locales.SELECT_COLOR}</span>
				<div className="color-picker__container">
					{colorList.map((color) => {
						return (
							<div
								key={color}
								className="color-picker__color_box"
								style={{ background: color }}
								value={JSON.stringify(color)}
								onClick={this.selectColor.bind(this)}
							>
								<img
									src="./assets/images/checked.png"
									value={JSON.stringify(color)}
									className={
										this.state.selectedColor === color
											? 'color-picker__billable-img'
											: 'color-picker__billable-img-hidden'
									}
								/>
							</div>
						);
					})}
				</div>
			</div>
		);
	}
}

export default ColorPicker;
