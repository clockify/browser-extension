import React from 'react'
import debounce from 'lodash/debounce';
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
        this.handleOnBlur = this.handleOnBlur.bind(this);
    }

    componentDidMount() {
        this.descriptionRef.current.focus(); 
        const len = this.descriptionRef.current.value.length;
        this.descriptionRef.current.selectionStart = len;
        this.descriptionRef.current.selectionEnd = len;
    }    


    onChangeDescription(e) {
        let val = e.target.value;
        // if(val[val.length-1] === '\n'){
        //     this.descriptionRef.current.blur();
        //     return;
        // }
        if (val.length > 3000) {
            val = val.slice(0, 3000);
            this.props.toaster.toast('error', locales.DESCRIPTION_LIMIT_ERROR_MSG(3000), 2);
        }
        this.setState({ description : val });
    }

    onSetDescription() {
        this.props.onSetDescription(this.state.description);
    }
    
    handleOnBlur() {
        this.onSetDescription();
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
                onBlur={this.handleOnBlur}
            />            
        )
    }
}

export default EditDescription;
