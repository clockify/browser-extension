import React, { UIEvent, useEffect, useState } from 'react';
import { ClientDto } from '~/DTOs/ClientDto.ts';
import { ClientListCreateForm } from '~/components/ClientList/ClientListCreateForm.tsx';
import { ClientListItem } from '~/components/ClientList/ClientListItem.tsx';
import { getBrowser } from '~/helpers/browser-helper.js';
import locales from '~/helpers/locales';

interface PropsInterface {
	selectedClient: Function;
	errorMessage: Function;
}

const pageSize: number = 50;

export const ClientList = (props: PropsInterface) => {
	const [selectedClient, setSelectedClient] = useState<ClientDto>({
		name: locales.SELECT_CLIENT
	});
	const [isOpen, setIsOpen] = useState(false);
	const [page, setPage] = useState(1);
	const [filter, setFilter] = useState('');
	const [clientList, setClientList] = useState([]);
	const [shouldLoadMore, setShouldLoadMore] = useState(false);
	const [shouldOpenCreateForm, setShouldOpenCreateForm] = useState(false);
	const [clientName, setClientName] = useState('');

	useEffect((): void => {
		getClients();
	}, []);

	useEffect(() => {
		if (isOpen) return;

		resetList();
		setFilter('');
	}, [isOpen]);

	useEffect(() => {
		if (page !== 1) return;

		if (!clientList.length) {
			if (filter) {
				// Filter clients
				getClients(1);
				return;
			}

			getClients(); // Clear client list
		} else if (!filter) {
			// Close client list
			getClients();
		}
	}, [isOpen, clientList, page, filter]);

	useEffect(() => {
		if (
			!clientName &&
			selectClient.name !== locales.SELECT_CLIENT &&
			!shouldOpenCreateForm &&
			clientList.length
		) {
			setShouldLoadMore(clientList.length >= pageSize);
		}
	}, [clientName, selectedClient, shouldOpenCreateForm, clientList]);

	const resetList = () => {
		setClientList([]);
		setPage(1);
	};

	const clearClientFilter = (): void => {
		resetList();
		setFilter('');
	};

	const filterClients = (event: { target: HTMLInputElement }): void => {
		resetList();
		setFilter(event.target.value.toLowerCase());
	};

	const selectClient = (client: ClientDto): void => {
		props.selectedClient(client);
		setSelectedClient(client);
		setIsOpen(false);
	};

	const getClients = (pageNumber: number = page): void => {
		getBrowser()
			.runtime.sendMessage({
			eventName: 'getClientsWithFilter',
			options: {
				page: pageNumber,
				pageSize,
				filter,
				archived: false
			}
		})
			.then(response => {
				setClientList(clientList.concat(response.data));
				setShouldLoadMore(response.data.length >= pageSize);
				setPage(pageNumber + 1);
			});
	};

	const addClient = (): void => {
		if (!clientName) {
			props.errorMessage(locales.NAME_IS_REQUIRED);
			return;
		}

		const pattern = /<[^>]+>/;
		const clientNameContainsWrongChars = pattern.test(clientName);

		if (clientNameContainsWrongChars) {
			return props.errorMessage(locales.FORBIDDEN_CHARACTERS);
		}

		getBrowser()
			.runtime.sendMessage({
			eventName: 'createClient',
			options: { client: { name: clientName } }
		})
			.then(response => {
				if (response.error) {
					return props.errorMessage(response.error?.message);
				}

				props.selectedClient(response.data);

				setClientName('');
				setSelectedClient(response.data);
				setShouldOpenCreateForm(false);
				setIsOpen(false);
				setClientList(clientList.concat(response.data));
			})
			.catch(error => props.errorMessage(error.response.data.message));
	};

	const cancel = (): void => {
		setClientName('');
		setShouldOpenCreateForm(false);
	};

	const handleScroll = (event: UIEvent<HTMLDivElement, globalThis.UIEvent>): void => {
		const element = event.target as HTMLDivElement;
		const bottom = element.scrollHeight - element.scrollTop === element.clientHeight;

		if (bottom && shouldLoadMore) {
			getClients();
		}
	};

	const openCreateClientForm = () => {
		setIsOpen(false);
		setShouldOpenCreateForm(true);
	};

	return (
		<div>
			<div onClick={() => setIsOpen(true)} className={'client-list-button'}>
				<span className="client-list-name">{selectedClient.name}</span>
				<span className="client-list-arrow"></span>
			</div>

			{isOpen && (
				<div className="client-list-open">
					<div onClick={() => setIsOpen(false)} className="invisible"></div>
					<div className="client-list-dropdown">
						<div onScroll={handleScroll} className="client-list-dropdown--content">
							<div className="client-list-input">
								<div className="client-list-input--border">
									<input
										autoFocus
										placeholder={locales.FILTER_NAME(
											locales.CLIENTS.toLowerCase()
										)}
										className="client-list-filter"
										onChange={filterClients}
										value={filter}
									/>
									<span
										className={
											!!filter ? 'client-list-filter__clear' : 'disabled'
										}
										onClick={clearClientFilter}></span>
								</div>
							</div>
							{clientList.map((client: ClientDto) => (
								<ClientListItem
									key={client.id}
									clientName={client.name || ''}
									onClientSelect={() => selectClient(client)}
								/>
							))}
							<div className="client-list__bottom-padding"></div>
							<div
								className="client-list__create-client"
								onClick={openCreateClientForm}>
								<span className="client-list__create-client--icon"></span>
								<span className="client-list__create-client--text">
									{locales.CREATE_NEW_CLIENT}
								</span>
							</div>
						</div>
					</div>
				</div>
			)}

			{shouldOpenCreateForm && (
				<div className="client-list__create-form--open">
					<ClientListCreateForm
						cancel={cancel}
						onInputBlur={() => setClientName(clientName.trim())}
						clientName={clientName}
						onAddClient={addClient}
						onInputChange={event => setClientName(event.target.value)}
					/>
				</div>
			)}
		</div>
	);
};
