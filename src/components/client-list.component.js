import * as React from "react";
import {ClientService} from "../services/client-service";
import locales from "../helpers/locales";

const pageSize = 50;
const clientService = new ClientService();

class ClientListComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            selectedClient : {
                name: locales.SELECT_CLIENT
            },
            isOpen: false,
            page: 1,
            filter: '',
            clientList: [],
            ready: false,
            loadMore: false,
            createFormOpened: false,
            clientName: "",
            isOffline: null
        }
        this.setAsyncStateItems = this.setAsyncStateItems.bind(this);
    }

    async setAsyncStateItems() {
        const isOffline = await localStorage.getItem('offline');
        this.setState({
            isOffline
        });
    }

    componentDidMount() {
        this.getClients(this.state.page);
        this.setAsyncStateItems();
    }

    async openClientDropdown() {
        if (!JSON.parse(await localStorage.getItem('offline'))) {
            this.setState({
                isOpen: true
            }, () => {
                document.getElementById('client-filter').focus();
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
            this.createClientName.focus();
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
            this.props.errorMessage(locales.NAME_IS_REQUIRED);
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
                     className={JSON.parse(this.state.isOffline) ?
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
                                        placeholder={locales.FILTER_NAME(locales.CLIENTS.toLowerCase())}
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
                                        <div key={client.name}>
                                            <div className="client-list-client"
                                                 onClick={this.selectClient.bind(this)}
                                                 value={JSON.stringify(client)}>{client.name}</div>
                                        </div>
                                    )
                                })
                            }
                            <div className={this.state.loadMore ? "client-list-load" : "disabled"}
                                 onClick={this.loadMoreClients.bind(this)}>{locales.LOAD_MORE}
                            </div>
                            <div className="client-list__bottom-padding"></div>
                            <div className="client-list__create-client"
                                 onClick={this.openCreateClient.bind(this)}>
                                <span className="client-list__create-client--icon"></span>
                                <span className="client-list__create-client--text">{locales.CREATE_NEW_CLIENT}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={this.state.createFormOpened ? "client-list__create-form--open" : "disabled"}>
                    <div className="client-list__create-form">
                        <div className="client-list__create-form__title-and-close">
                            <div className="client-list__create-form--title">
                            {locales.CREATE_NEW_CLIENT}
                            </div>
                            <span onClick={this.cancel.bind(this)}
                                  className="client-list__create-form__close"></span>
                        </div>
                        <div className="client-list__create-form--divider"></div>
                        <input
                            ref={input => {this.createClientName = input}}
                            className="client-list__create-form--client-name"
                            placeholder={locales.CLIENT_NAME}
                            value={this.state.clientName}
                            onChange={this.handleChange.bind(this)}>
                        </input>
                        <div onClick={this.addClient.bind(this)}
                              className="client-list__create-form--confirmation_button">{locales.ADD}</div>
                        <span onClick={this.cancel.bind(this)}
                              className="client-list__create-form--cancel">{locales.CANCEL}</span>
                    </div>
                </div>
            </div>
        )
    }
}

export default ClientListComponent;