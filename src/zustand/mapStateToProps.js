import React from 'react';
import { useAppStore } from './store';

export const mapStateToProps = (selectors) => (Component) => {
	return (props) => {
		const selectedState = useAppStore(selectors);
		return <Component {...props} {...selectedState} />;
	};
};
