import React from 'react'
import debounce from 'lodash/debounce';
import { locale } from 'moment';
import locales from "../helpers/locales";

class EditDescription extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            description: this.props.description
        };

        this.descriptionRef = React.createRef();
        this.onChangeDescription = this.onChangeDescription.bind(this);
        this.onChangeDescriptionDelayed = debounce(this.onSetDescription, 500);
        this.onSetDescription = this.onSetDescription.bind(this);
    }

    componentDidMount() {
        this.descriptionRef.current.focus(); 
        const len = this.descriptionRef.current.value.length;
        this.descriptionRef.current.selectionStart = len;
        this.descriptionRef.current.selectionEnd = len;
    }    


    onChangeDescription(e) {
        const val = e.target.value;
        this.setState({ description : val }, () => {
            this.onChangeDescriptionDelayed()
        })
    }

    onSetDescription() {
        this.props.onSetDescription(this.state.description);
    }

    render() {
        return (
            <textarea
                id={"description"}
                type="text"
                value={this.state.description}
                ref={this.descriptionRef}
                className={"edit-form-description"}
                placeholder={this.props.descRequired ? `${locales.DESCRIPTION_LABEL} ${locales.REQUIRED_LABEL}` : locales.DESCRIPTION_LABEL}
                onChange={this.onChangeDescription}
            />            
        )
    }
}

export default EditDescription;
