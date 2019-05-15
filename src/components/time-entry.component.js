import * as React from 'react';
import EditForm from './edit-form.component';
import * as ReactDOM from 'react-dom';
import {checkConnection} from "./check-connection";
import Login from "./login.component";

class TimeEntry extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            ready: false,
            title: ''
        }
    }

    componentDidMount() {
    }

    goToEdit() {
        if(!this.props.timeEntry.isLocked) {
            ReactDOM.unmountComponentAtNode(document.getElementById('mount'));
            if (checkConnection()) {
                ReactDOM.render(<Login/>, document.getElementById('mount'));
            }
            ReactDOM.render(<EditForm changeMode={this.changeMode.bind(this)}
                                      timeEntry={this.props.timeEntry}
                                      workspaceSettings={this.props.workspaceSettings}
                                      timeFormat={this.props.timeFormat}/>, document.getElementById('mount'));
        }
    }

    continueTimeEntry() {
        if(!this.props.timeEntry.isLocked) {
            this.props.playTimeEntry(this.props.timeEntry);
        }
    }

    createTitle() {
        let title = "";

        if (this.props.timeEntry.description) {
            title = "Description: " + this.props.timeEntry.description;
        }

        if (this.props.project) {
            if (this.props.project.name) {
                title = title + "\nProject: " + this.props.project.name;
            }

            if (this.props.task && this.props.task.name) {
                title = title + "\nTask: " + this.props.task.name;
            }

            if (this.props.project.client && this.props.project.client.name) {
                title = title + "\nClient: " + this.props.project.client.name;
            }
        }

        this.setState({
            title: title
        }, () => {
            this.setState({
                ready: true
            })
        });
    }

    changeMode(mode) {
        this.props.changeMode(mode);
    }

    render() {
        if (this.props.project !== undefined && this.props.task !== undefined) {
            if (this.state.ready) {
                return (
                    <div className={this.props.timeEntry.isLocked ? "time-entry-locked" : "time-entry"}
                         title={this.state.title}>
                        <div className="time-entry-description" onClick={this.goToEdit.bind(this)}>
                            <div className="description"
                                 style={this.props.timeEntry.description ? {color: '#000'} : {color: '#999999'}}>
                                {this.props.timeEntry.description ? this.props.timeEntry.description : "What's up"}
                            </div>
                            <span style={this.props.project ? {color: this.props.project.color} : {}} className={this.props.project ? "time-entry-project" : "disabled"}>
                                <div>
                                    <div style={this.props.project ? {background: this.props.project.color} : {}} className="dot"></div>
                                    <span className="time-entry__project-name" >{this.props.project ? this.props.project.name : ""}</span>
                                </div>
                                <span className="time-entry__task-name"
                                      style={{color: "#999999"}}>
                                    {this.props.task ? " -" + " " + this.props.task.name : ""}
                                </span>
                            </span>
                        </div>
                        <span onClick={this.goToEdit.bind(this)}
                              className="time-entry-duration">
                            {this.props.timeEntry.duration}
                        </span>
                        <span onClick={this.continueTimeEntry.bind(this)}
                              className="time-entry-arrow">
                            <img id="play-icon" src="./assets/images/play-normal.png"/>
                        </span>
                    </div>
                )
            } else {
                this.createTitle();
                return null;
            }
        } else {
            return null;
        }
    }

}
export default TimeEntry;
