import React from 'react';
import locales from '../helpers/locales';

class EditDescription extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			description: this.props.description,
		};

		this.prevDescription = null;
		this.descriptionRef = React.createRef();
		this.onChangeDescription = this.onChangeDescription.bind(this);
		this.handleOnBlur = this.handleOnBlur.bind(this);
		this.handleOnFocus = this.handleOnFocus.bind(this);
	}

	componentDidMount() {
		this.descriptionRef.current.focus();
		const len = this.descriptionRef.current.value.length;
		this.descriptionRef.current.selectionStart = len;
		this.descriptionRef.current.selectionEnd = len;
	}

	onChangeDescription(e) {
		let val = e.target.value;
		if (val.length > 3000) {
			val = val.slice(0, 3000);
			this.props.toaster.toast(
				'error',
				locales.DESCRIPTION_LIMIT_ERROR_MSG(3000),
				2
			);
		}
		this.setState({ description: val });
	}

	handleOnBlur(event) {
		if (this.prevDescription !== this.state.description) {
			const description = event.target.value;
			const pattern = /<[^>]+>/;
			const descriptionContainsWrongChars = pattern.test(description);

			if (descriptionContainsWrongChars) {
				this.props.toaster.toast('error', locales.FORBIDDEN_CHARACTERS, 2);
			}

			this.props.onSetDescription(this.state.description);
		}
	}

	handleOnFocus() {
		this.prevDescription = this.state.description;
	}

	render() {
		return (
			<textarea
				id={'description'}
				type="text"
				value={this.state.description}
				ref={this.descriptionRef}
				className={'edit-form-description'}
				placeholder={
					this.props.descRequired
						? `${locales.DESCRIPTION_LABEL} ${locales.REQUIRED_LABEL}`
						: locales.DESCRIPTION_LABEL
				}
				onChange={this.onChangeDescription}
				onBlur={this.handleOnBlur}
				onFocus={this.handleOnFocus}
			/>
		);
	}
}

export default EditDescription;
