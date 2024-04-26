import React from 'react';
import useCombinedStore from './useCombinedStore';

function withZustandStore(Component) {
	return function WrappedComponent(props) {
		const storeProps = useCombinedStore();
		return <Component {...props} {...storeProps} />;
	}
}

export default withZustandStore;