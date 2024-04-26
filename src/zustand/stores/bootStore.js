import { create } from 'zustand';

const useBootStore = create(set => ({
	bootData: null,
	setBootData: (data) => set(state => ({
		bootData: {...data}
	}))
}));

export default useBootStore;