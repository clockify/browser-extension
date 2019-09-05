import * as React from "react";
import {isAppTypeMobile} from "../helpers/app-types-helper";
import {ClientService} from "../services/client-service";
import Toaster from "./create-project.component";

const pageSize = 50;
const clientService = new ClientService();

class ClientListComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            selectedClient : {
                name: "Select client"
            },
            isOpen: false,
            page: 1,
            filter: '',
            clientList: [],
            ready: false,
            loadMore: false,
            createFormOpened: false,
            clientName: ""
        }
    }

    componentDidMount() {
        this.getClients(this.state.page);
    }

    openClientDropdown() {
        if (!JSON.parse(localStorage.getItem('offline'))) {
            this.setState({
                isOpen: true
            }, () => {
                if (!isAppTypeMobile()) {
                    document.getElementById('client-filter').focus();
                }
            });
        }
    }

    closeClientList() {
        document.getElementById('client-dropdown').scroll(0, 0);
        this.setState({
            isOpen: false,
            clientList: [],
            page: 1,
            filter: ''
        }, () => {
            document.getElementById('client-filter').value = "";
            this.getClients(this.state.page);
        });
    }

    clearClientFilter() {
        this.setState({
            clientList: [],
            filter: '',
            page: 1
        }, () => {
            this.getClients(this.state.page);
            document.getElementById('client-filter').value = null
        });
    }

    filterClients() {
        this.setState({
            clientList: [],
            filter: document.getElementById('client-filter').value.toLowerCase(),
            page: 1
        }, () => {
            this.getClients(this.state.page);
        });
    }

    getClients(page) {
        clientService.getClientsWithFilter(page, pageSize, this.state.filter).then(response => {
            this.setState({
                clientList: this.state.clientList.concat(response.data),
                loadMore: response.data.length === pageSize,
                ready: true
            });
        }).catch()
    }

    loadMoreClients() {
        this.getClients(this.state.page);
    }

    selectClient(event) {
        let client = JSON.parse(event.target.getAttribute('value'));
        this.props.selectedClient(client);

        this.setState({
            selectedClient: client,
            isOpen: false
        });
    }

    openCreateClient() {
        this.setState({
            createFormOpened: true
        }, () => {
            this.closeClientList();
        });
    }

    handleChange(event) {
        this.setState({
            clientName: event.target.value
        });
    }

    addClient() {
        let client = {};
        if (!this.state.clientName) {
            this.props.errorMessage('Name is required.');
            return;
        }
        client.name = this.state.clientName;

        clientService.createClient(client).then(response => {
            this.props.selectedClient(response.data);

            this.setState({
                selectedClient: response.data,
                createFormOpened: false,
                clientList: this.state.clientList.concat(response.data)
            }, () => {
                this.setState({
                    loadMore: this.state.clientList.length >= pageSize
                });
            });
        }).catch(error => {
            this.props.errorMessage(error.response.data.message);
        });
    }

    cancel() {
        this.setState({
            clientName: "",
            createFormOpened: false
        });
    }

    render() {
        return (
            <div>
                <div onClick={this.openClientDropdown.bind(this)}
                     className={JSON.parse(localStorage.getItem('offline')) ?
                         "client-list-button-offline" : "client-list-button"}>
                    <span className="client-list-name">
                        {this.state.selectedClient.name}
                    </span>
                    <span className="client-list-arrow">
                    </span>
                </div>
                <div className={this.state.isOpen ? "client-list-open" : "disabled"}>
                    <div onClick={this.closeClientList.bind(this)} className="invisible"></div>
                    <div className="client-list-dropdown"
                         id="client-dropdown">
                        <div className="client-list-dropdown--content">
                            <div className="client-list-input">
                                <div className="client-list-input--border">
                                    <input
                                        placeholder="Filter clients"
                                        className="client-list-filter"
                                        onChange={this.filterClients.bind(this)}
                                        id="client-filter"
                                    />
                                    <span className={!!this.state.filter ? "client-list-filter__clear" : "disabled"}
                                          onClick={this.clearClientFilter.bind(this)}></span>
                                </div>
                            </div>
                            {
                                this.state.clientList.map(client => {
                                    return (
                                        <div>
                                            <div className="client-list-client"
                                                 onClick={this.selectClient.bind(this)}
                                                 value={JSON.stringify(client)}>{client.name}</div>
                                        </div>
                                    )
                                })
                            }
                            <div className={this.state.loadMore ? "client-list-load" : "disabled"}
                                 onClick={this.loadMoreClients.bind(this)}>Load more
                            </div>
                            <div className="client-list__bottom-padding"></div>
                            <div className="client-list__create-client"
                                 onClick={this.openCreateClient.bind(this)}>
                                <span className="client-list__create-client--icon"></span>
                                <span className="client-list__create-client--text">Create new client</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={this.state.createFormOpened ? "client-list__create-form--open" : "disabled"}>
                    <div className="client-list__create-form">
                        <div className="client-list__create-form__title-and-close">
                            <div className="client-list__create-form--title">
                                Create new client
                            </div>
                            <span onClick={this.cancel.bind(this)}
                                  className="client-list__create-form__close"></span>
                        </div>
                        <div className="client-list__create-form--divider"></div>
                        <input
                            className="client-list__create-form--client-name"
                            placeholder="Client name"
                            value={this.state.clientName}
                            onChange={this.handleChange.bind(this)}>
                        </input>
                        <div onClick={this.addClient.bind(this)}
                              className="client-list__create-form--confirmation_button">Add</div>
                        <span onClick={this.cancel.bind(this)}
                              className="client-list__create-form--cancel">Cancel</span>
                    </div>
                </div>
            </div>
        )
    }
}

export default ClientListComponent;