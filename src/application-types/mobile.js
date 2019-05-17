import React from 'react';
import ReactDOM from 'react-dom';
import HomePage from "../components/home-page.component";
import Login from "../components/login.component";
import {UserService} from "../services/user-service";
import {LocalStorageService} from "../services/localStorage-service";

const userService = new UserService();
const localStorageService = new LocalStorageService();

export class Mobile {

    afterLoad() {
        const userId = this.loadFromStorage('userId');
        if (this.loadFromStorage('token') && userId) {
            if (!JSON.parse(localStorageService.get('offline'))) {
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