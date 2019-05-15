import React from 'react';
import ReactDOM from 'react-dom';
import HomePage from "../components/home-page.component";
import {getIconStatus} from "../enums/browser-icon-status-enum";
import {UserService} from "../services/user-service";
import Login from "../components/login.component";
import {LocalStorageService} from "../services/localStorage-service";

const userService = new UserService();
const localStorageService = new LocalStorageService();

export class Desktop {

    setIcon(iconStatus) {
        if (iconStatus === getIconStatus().timeEntryStarted) {
            changeTrayIcon(true);
        } else {
            changeTrayIcon(false);
        }
    }

    afterLoad() {
        const token = this.loadFromStorage('token');
        const userId = this.loadFromStorage('userId');
        if (token && token !=='' && userId) {
            if (JSON.parse(localStorageService.get('offline'))) {
                userService.getUser(userId)
                    .then(response => {
                        let data = response.data;

                        localStorage.setItem('userEmail', data.activeWorkspace);
                        localStorage.setItem('activeWorkspaceId', data.activeWorkspace);
                        localStorage.setItem('userSettings', JSON.stringify(data.settings));

                        ReactDOM.render(<HomePage/>, document.getElementById('mount'));
                    }).catch(error => {
                    ReactDOM.render(
                        <Login logout={true}/>,
                        document.getElementById('mount')
                    );
                });
            } else {
                ReactDOM.render(<HomePage/>, document.getElementById('mount'));
            }
        } else {
            ReactDOM.render(
                <Login logout={true}/>,
                document.getElementById('mount')
            );
        }
    }

    loadFromStorage(key) {
        return localStorage.getItem(key);
    }
}