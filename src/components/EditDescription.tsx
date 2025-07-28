import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import ToasterComponent from '~/components/toaster-component';
import locales from '~/helpers/locales';

interface PropsInterface {
	description: string;
	toaster: ToasterComponent;
	onSetDescription: Function;
	descRequired: boolean;
}

export const EditDescription = (props: PropsInterface) => {
	const [description, setDescription] = useState(props?.description ?? '');
	const [previousDescription, setPreviousDescription] = useState('');

	const descriptionInputRef = useRef(null);

	useEffect((): void => {
		const length = descriptionInputRef.current.value.length;

		descriptionInputRef.current.focus();
		descriptionInputRef.current.selectionStart = length;
		descriptionInputRef.current.selectionEnd = length;
	}, []);

	const onChangeDescription = (event: ChangeEvent<HTMLTextAreaElement>): void => {
		let value = event.target.value;

		if (value.length > 3000) {
			props.toaster.toast('error', locales.DESCRIPTION_LIMIT_ERROR_MSG(3000), 2);
		}

		setDescription(value);
	};

	const handleOnBlur = (event: ChangeEvent<HTMLTextAreaElement>): void => {
		if (previousDescription !== description) {
			const description = event.target.value;
			const pattern = /<[^>]+>/;
			const descriptionContainsWrongChars = pattern.test(description);

			if (descriptionContainsWrongChars) {
				props.toaster.toast('error', locales.FORBIDDEN_CHARACTERS, 2);
			}

			props.onSetDescription(description);
		}
	};

	const handleOnFocus = (): void => {
		setPreviousDescription(description);
	};

	return (
		<textarea
			id={'description'}
			type="text"
			value={description}
			ref={descriptionInputRef}
			className={'edit-form-description'}
			placeholder={
				props.descRequired
					? `${locales.DESCRIPTION_LABEL} ${locales.REQUIRED_LABEL}`
					: locales.DESCRIPTION_LABEL
			}
			onChange={onChangeDescription}
			onBlur={handleOnBlur}
			onFocus={handleOnFocus}
		/>
	);
};