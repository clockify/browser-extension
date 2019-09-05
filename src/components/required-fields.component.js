import * as React from 'react';
import Header from './header.component';

class RequiredFields extends React.Component {

    constructor(props) {
        super(props);
    }

    componentDidMount(){
    }

    goToEdit() {
        this.props.goToEdit();
    }

    render() {
        return(
            <div>
                <Header
                    showActions={true}
                    mode={localStorage.getItem('mode')}
                    disableManual={localStorage.getItem('inProgress')}
                    disableAutomatic={false}
                />
                <div className="required-fields">
                    <h3>ALERT</h3>
                    <span>This entry can't be saved, please add {this.props.field}.</span>
                    <button onClick={this.goToEdit.bind(this)}>EDIT ENTRY</button>
                </div>
            </div>
        )
    }
}

export default RequiredFields;