import React, { Component } from 'react';
import locales from '../helpers/locales';
import { getBrowser } from '../helpers/browser-helper';
import { debounce } from 'lodash';

const pageSize = 50;

class ClientListComponent extends Component {
	constructor(props) {
		super(props);

		this.state = {
			selectedClient: {
				name: locales.SELECT_CLIENT
			},
			isOpen: false,
			page: 1,
			filter: '',
			clientList: [],
			ready: false,
			loadMore: false,
			createFormOpened: false,
			clientName: '',
			isOffline: null
		};
		this.setAsyncStateItems = this.setAsyncStateItems.bind(this);
		this.clientFilterRef = null;
		this.clientDropdownRef = null;
		this.filterClients = this.filterClients.bind(this);
		this.getClients = debounce(this.getClients, 500);
		this.handleScroll = this.handleScroll.bind(this);
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
			this.setState(
				{
					isOpen: true
				},
				() => {
					this.clientFilterRef.focus();
				}
			);
		}
	}

	closeClientList() {
		this.clientDropdownRef.scroll(0, 0);
		this.setState(
			{
				isOpen: false,
				clientList: [],
				page: 1,
				filter: ''
			},
			() => {
				this.getClients(this.state.page);
			}
		);
	}

	clearClientFilter() {
		this.setState(
			{
				clientList: [],
				filter: '',
				page: 1
			},
			() => {
				this.getClients(this.state.page);
			}
		);
	}

	filterClients(e) {
		this.setState(
			{
				clientList: [],
				filter: e.target.value.toLowerCase(),
				page: 1
			},
			() => {
				this.getClients(1);
			}
		);
	}

	getClients(page) {
		getBrowser()
			.runtime.sendMessage({
			eventName: 'getClientsWithFilter',
			options: {
				page,
				pageSize,
				filter: this.state.filter,
				archived: false
			}
		})
			.then((response) => {
				this.setState((state) => ({
					clientList: state.clientList.concat(response.data),
					loadMore: response.data.length >= pageSize,
					ready: true,
					page: state.page + 1
				}));
			})
			.catch();
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
		this.setState(
			{
				createFormOpened: true
			},
			() => {
				this.closeClientList();
				this.createClientName.focus();
			}
		);
	}

	handleChange(event) {
		this.setState({
			clientName: event.target.value
		});
	}

	addClient() {
		let client = {};
		if (!this.state.clientName.trim()) {
			this.props.errorMessage(locales.NAME_IS_REQUIRED);
			return;
		}

		const pattern = /<[^>]+>/;
		const clientNameContainsWrongChars = pattern.test(this.state.clientName);

		if (clientNameContainsWrongChars) {
			return this.props.errorMessage(locales.FORBIDDEN_CHARACTERS);
		}

		client.name = this.state.clientName;

		getBrowser()
			.runtime.sendMessage({
			eventName: 'createClient',
			options: {
				client
			}
		})
			.then((response) => {
				if (response.error)
					return this.props.errorMessage(response.error?.message);

				this.props.selectedClient(response.data);

				this.setState(
					{
						clientName: '',
						selectedClient: response.data,
						createFormOpened: false,
						clientList: this.state.clientList.concat(response.data)
					},
					() => {
						this.setState({
							loadMore: this.state.clientList.length >= pageSize
						});
					}
				);
			})
			.catch((error) => {
				this.props.errorMessage(error.response.data.message);
			});
	}

	cancel() {
		this.setState({
			clientName: '',
			createFormOpened: false
		});
	}

	handleScroll(event) {
		const bottom =
			event.target.scrollHeight - event.target.scrollTop ===
			event.target.clientHeight;
		if (bottom && this.state.loadMore) {
			this.loadMoreClients();
		}
	}

	render() {
		return (
			<div>
				<div
					onClick={this.openClientDropdown.bind(this)}
					className={
						JSON.parse(this.state.isOffline)
							? 'client-list-button-offline'
							: 'client-list-button'
					}
				>
					<span className="client-list-name">
						{this.state.selectedClient.name}
					</span>
					<span className="client-list-arrow"></span>
				</div>
				<div className={this.state.isOpen ? 'client-list-open' : 'disabled'}>
					<div
						onClick={this.closeClientList.bind(this)}
						className="invisible"
					></div>
					<div
						className="client-list-dropdown"
						ref={(el) => (this.clientDropdownRef = el)}
					>
						<div
							onScroll={this.handleScroll}
							className="client-list-dropdown--content"
						>
							<div className="client-list-input">
								<div className="client-list-input--border">
									<input
										placeholder={locales.FILTER_NAME(
											locales.CLIENTS.toLowerCase()
										)}
										className="client-list-filter"
										onChange={this.filterClients}
										ref={(e) => (this.clientFilterRef = e)}
										value={this.state.filter}
									/>
									<span
										className={
											!!this.state.filter
												? 'client-list-filter__clear'
												: 'disabled'
										}
										onClick={this.clearClientFilter.bind(this)}
									></span>
								</div>
							</div>
							{this.state.clientList.map((client) => {
								return (
									<div key={client.name}>
										<div
											className="client-list-client"
											onClick={this.selectClient.bind(this)}
											value={JSON.stringify(client)}
										>
											{client.name}
										</div>
									</div>
								);
							})}
							<div className="client-list__bottom-padding"></div>
							<div
								className="client-list__create-client"
								onClick={this.openCreateClient.bind(this)}
							>
								<span className="client-list__create-client--icon"></span>
								<span className="client-list__create-client--text">
									{locales.CREATE_NEW_CLIENT}
								</span>
							</div>
						</div>
					</div>
				</div>
				<div
					className={
						this.state.createFormOpened
							? 'client-list__create-form--open'
							: 'disabled'
					}
				>
					<div className="client-list__create-form">
						<div className="client-list__create-form__title-and-close">
							<div className="client-list__create-form--title">
								{locales.CREATE_NEW_CLIENT}
							</div>
							<span
								onClick={this.cancel.bind(this)}
								className="client-list__create-form__close"
							></span>
						</div>
						<div className="client-list__create-form--divider"></div>
						<input
							ref={(input) => {
								this.createClientName = input;
							}}
							className="client-list__create-form--client-name"
							placeholder={locales.CLIENT_NAME}
							value={this.state.clientName}
							onChange={this.handleChange.bind(this)}
						></input>
						<div
							onClick={this.addClient.bind(this)}
							className="client-list__create-form--confirmation_button"
						>
							{locales.ADD}
						</div>
						<span
							onClick={this.cancel.bind(this)}
							className="client-list__create-form--cancel"
						>
							{locales.CANCEL}
						</span>
					</div>
				</div>
			</div>
		);
	}
}

export default ClientListComponent;
