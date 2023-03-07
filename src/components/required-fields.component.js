import * as React from 'react';
import Header from './header.component';

class RequiredFields extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			inProgress: null,
		};
	}

	async componentDidUpdate() {
		const inProgress = await localStorage.getItem('inProgress');
		if (inProgress !== this.state.inProgress) {
			this.setState({
				inProgress,
			});
		}
	}

	goToEdit() {
		this.props.goToEdit();
	}

	render() {
		return (
			<div>
				<Header
					showActions={true}
					mode={this.props.mode}
					disableManual={this.state.inProgress}
					disableAutomatic={false}
				/>
				<div className="required-fields">
					<h3>ALERT</h3>
					<span>This entry can't be saved, please add {this.props.field}.</span>
					<button onClick={this.goToEdit.bind(this)}>EDIT ENTRY</button>
				</div>
			</div>
		);
	}
}

export default RequiredFields;
