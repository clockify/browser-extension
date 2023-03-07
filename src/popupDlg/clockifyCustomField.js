var aBrowser = chrome || browser;

var ClockifyCustomField = class {
	constructor({ wsCustomField, timeEntryId, value, index }) {
		const {
			id,
			name,
			allowedValues,
			description,
			placeholder,
			projectDefaultValues,
			required,
			status,
			type,
			workspaceDefaultValue,
			onlyAdminCanEdit,
		} = wsCustomField;

		this.customFieldId = id;
		this.timeEntryId = timeEntryId;
		this.value = value;
		this.name = name;
		this.type = type;
		this.index = index;

		this.divId = `divCustomField_${index}`;

		this.allowedValues = allowedValues;
		this.placeholder = placeholder ?? this.name.toLowerCase();
		this.title = description ?? this.name.toLowerCase();
		this.required = required;
		this.status = status;
		this.projectDefaultValues = projectDefaultValues;
		this.workspaceDefaultValue = workspaceDefaultValue;
		this.onlyAdminCanEdit = onlyAdminCanEdit;
		this.isDisabled = onlyAdminCanEdit && !_clockifyPopupDlg.isOwnerOrAdmin;
	}

	create() {
		const div = document.createElement('div');
		div.setAttribute('id', `${this.divId}`);
		div.setAttribute('class', 'clockify-custom-field');
		div.innerHTML = `${this.name} (${this.type})`;
		return div;
	}

	setValue(value) {
		this.value = value;
	}

	hide(divCustomFields) {
		const el = $(`#${this.divId}`, divCustomFields);
		el.style.display = 'none';
	}

	show(divCustomFields) {
		const el = $(`#${this.divId}`, divCustomFields);
		el.style.display = 'block';
	}

	isVisible(divCustomFields) {
		const el = $(`#${this.divId}`, divCustomFields);
		return el.style.display !== 'none';
	}

	onChanged(val = null) {
		aBrowser.runtime.sendMessage(
			{
				eventName: 'submitCustomField',
				options: {
					timeEntryId: this.timeEntryId,
					customFieldId: this.customFieldId,
					value: val ?? this.value,
				},
			},
			(response) => {
				if (!response) {
					return response;
				}
				const { data, status } = response;
				if (status !== 201) {
					if (status === 400) {
						alert(clockifyLocales.CUSTOM_FIELDS + '?');
					}
				}
				aBrowser.storage.local.get(
					'timeEntryInProgress',
					({ timeEntryInProgress }) => {
						if (timeEntryInProgress && timeEntryInProgress.customFieldValues) {
							const updatedCFs = timeEntryInProgress.customFieldValues.map(
								(el) =>
									el.customFieldId === data.customFieldId
										? Object.assign(el, { value: data.value })
										: el
							);
							aBrowser.storage.local.set({
								timeEntryInProgress: Object.assign(timeEntryInProgress, {
									customFieldValues: updatedCFs,
								}),
							});
						}
					}
				);
			}
		);
	}

	destroy() {}
};

var ClockifyCustomFieldText = class extends ClockifyCustomField {
	constructor(obj) {
		super(obj);
	}

	create() {
		const div = document.createElement('div');
		div.setAttribute('id', `${this.divId}`);
		div.setAttribute(
			'class',
			`clockify-custom-field-ta${this.isDisabled ? '-disabled' : ''}`
		);
		div.innerHTML =
			// data-autoresize
			`<textarea id='taCustomField${this.index}' index='${
				this.index
			}' rows='1' class='custom-field-text${
				this.isDisabled ? '-disabled' : ''
			}' title="${this.title}" placeholder="${this.placeholder}" ${
				this.isDisabled ? 'disabled' : ''
			}>${this.value ?? ''}</textarea>`;
		return div;
	}

	redrawValue(divCustomFields) {
		const textarea = $(`#${this.divId} > textarea`, divCustomFields);
		textarea.value = this.value ?? '';
	}

	onChanged(ta) {
		this.value = ta.value.trim().replaceAll('\n', ' ');
		super.onChanged();
	}
};

var ClockifyCustomFieldNumber = class extends ClockifyCustomField {
	constructor(customField) {
		super(customField);
	}
	create() {
		const div = document.createElement('div');
		div.setAttribute('id', `${this.divId}`);
		div.setAttribute(
			'class',
			`clockify-custom-field${this.isDisabled ? '-disabled' : ''}`
		);
		div.innerHTML = `<input id='txtCustomField${
			this.index
		}' type="number" index='${this.index}' value="${
			this.value ?? ''
		}" class='custom-field-number${
			this.isDisabled ? '-disabled' : ''
		}' title="${this.title}" placeholder="${this.placeholder}" ${
			this.isDisabled ? 'disabled' : ''
		}/>`;
		return div;
	}

	redrawValue(divCustomFields) {
		const input = $(`#${this.divId} > input`, divCustomFields);
		input.value = this.value ?? '';
	}

	onChanged(el) {
		this.value = parseFloat(el.value);
		super.onChanged();
	}
};

var ClockifyCustomFieldLink = class extends ClockifyCustomField {
	constructor(customField) {
		super(customField);
	}

	get placeholderOrName() {
		if (!this.placeholder) return this.name;
		return this.placeholder;
	}

	draw() {
		if (!!this.value) {
			return `<div class='clockify-custom-field-inner${
				this.isDisabled ? '-disabled' : ''
			}'>\
            <a href="${
							this.value
						}" style="color: #03a9f4;font-size:14px;" id='aCustomFieldLink' target="_blank" title="${
				this.title
			}">${this.placeholderOrName}</a>\
            <img id='aEditCustomFieldLink' index='${this.index}' title="${
				this.title
			}" src='${aBrowser.runtime.getURL('assets/images/edit-unsynced.png')}'\
                style='margin-left: 8px; width:14px; height:14px;'\
                class="${this.isDisabled ? '' : 'clockify-close-dlg-icon'}" />\
        </div>`;
		} else {
			return `<input id='txtCustomField${this.index}' name='txtCustomField${
				this.index
			}' type="url" index='${
				this.index
			}' class='custom-field-link clockify-link-input${
				this.isDisabled ? '-disabled' : ''
			}' style='margin: 0' title="${this.title}" placeholder="${
				this.placeholderOrName
			}" ${this.isDisabled ? 'disabled' : ''}>`;
		}
	}

	create() {
		// list='customField${this.index}'
		const div = document.createElement('div');
		div.setAttribute('id', `${this.divId}`);
		div.setAttribute(
			'class',
			`clockify-custom-field${this.isDisabled ? '-disabled' : ''}`
		);

		// if (this.value === "window.location.href") {
		//     this.value = window.location.href;
		//     setTimeout(() => {
		//         super.onChanged();
		//     })
		// }

		const str = this.draw();

		div.innerHTML = str;
		return div;
	}

	redrawValue(divCustomFields) {
		const div = $(`#${this.divId}`, divCustomFields);
		div.innerHTML = this.draw();
	}

	static injectLinkModal() {
		if (document.getElementById('divClockifyLinkModal')) return;
		const linkModal = document.createElement('div');
		linkModal.setAttribute('id', 'divClockifyLinkModal');
		linkModal.classList.add('clockify-modal');
		linkModal.style.display = 'none';
		// <img class='clockify-close' src="assets/images/ui-icons/close.svg">\
		// <label for="editModalInput" class="">link</label>\
		linkModal.innerHTML = `<div class='clockify-modal-content'>\
            <div class="cl-modal-header">\
                <h1 class="cl-modal-title">Edit link</h1>\
                <button type="button" class="cl-close">\
                    <span aria-hidden="true">\
                        <span class='clockify-close' style='background: url(${aBrowser.runtime.getURL(
													'assets/images/closeX.svg'
												)}) no-repeat;'></span>                  
                    </span>\
                </button>\
            </div>\
            <div class="cl-modal-body">\
                <span id='clLinkLabel' class='custom-field-link-label'></span>
                <input type="url" id='txtCustomFieldLinkModal' class='custom-field-link clockify-link-input-modal' placeholder="link" autocomplete="off">\
            </div>\
            <div class="cl-modal-footer">\
                <a class="clockify-cancel" disabled="">${
									clockifyLocales.CANCEL
								}</a>\
                <a class="clockify-save clockify-save--disabled" disabled="">SAVE</a>\
            </div>\
        </div>`;
		document.body.appendChild(linkModal);
	}

	showModal() {
		_clockifyPopupDlg.closeAllDropDowns();
		var div = document.getElementById('divClockifyLinkModal');
		div.setAttribute('index', this.index);
		const input = $('input.clockify-link-input-modal', div);
		input.value = this.value;
		const label = $('#clLinkLabel', div);
		let ph = this.placeholderOrName;
		if (ph.length > 40) ph = ph.substr(40) + ' ...';
		label.textContent = ph;
		div.style.display = 'block';
	}

	onClicked(el) {
		if (!this.isDisabled) {
			switch (el.id) {
				case 'aEditCustomFieldLink':
					{
						this.showModal();
					}
					break;

				default:
					break;
			}
		}
	}

	onClickedLinkModal(divCustomFields, divClockifyLinkModal, target) {
		const div = divClockifyLinkModal;
		if (target.classList.contains('clockify-modal')) {
			div.style.display = 'none'; // out of the modal
		} else if (target.classList.contains('clockify-close')) {
			div.style.display = 'none';
		} else if (target.classList.contains('clockify-cancel')) {
			div.style.display = 'none';
		} else if (target.classList.contains('clockify-save')) {
			const input = $('input.clockify-link-input-modal', div);
			this.onChanged(input);
			this.redrawValue();
			// const link = $('#aCustomFieldLink', $(`#${this.divId}`, divCustomFields));
			// link.href = input.value;
			div.style.display = 'none';
		}
	}

	onChanged(el) {
		this.value = !!el.value ? el.value : null;
		super.onChanged();
	}
};

var ClockifyCustomFieldCheckbox = class extends ClockifyCustomField {
	constructor(customField) {
		super(customField);
	}

	draw() {
		let ph = this.placeholder ?? this.name;
		return (
			`<label class="clockify-switch" title="${this.title}">` +
			`<input id='switchboxCustomField' index='${this.index}' ${
				this.value ? 'checked' : ''
			} class="clockify-switch-input" type="checkbox" ${
				this.isDisabled ? 'disabled' : ''
			}>` +
			// id begins with 'switchbox' to prevent: e.preventDefault(); in clockifyButton::clockifyClicks()
			`<span id='switchboxSpan' class="clockify-switch-slider clockify-switch-round"></span>` +
			`</label>` +
			`<span id='switchboxLabel' class='clockify-switch-label' title="${this.title}">${ph}</span>`
		);
	}

	create() {
		const div = document.createElement('div');
		div.setAttribute('id', `${this.divId}`);
		div.setAttribute('class', `clockify-custom-field`);
		div.innerHTML =
			`<div class='clockify-custom-field-inner-checkbox${
				this.isDisabled ? '-disabled' : ''
			}'>` +
			this.draw() +
			'</div>';
		return div;
	}

	redrawValue(divCustomFields) {
		const div = $(`#${this.divId} > div`, divCustomFields);
		div.innerHTML = this.draw();
	}

	onChanged(el) {
		this.value = el.checked;
		super.onChanged();
	}
};
