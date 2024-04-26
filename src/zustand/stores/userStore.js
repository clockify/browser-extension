import { create } from 'zustand';

const useUserStore = create(set => ({
	userData: null,
	setUserData: (data) => set(state => ({
		userData: {...data}
	}))
}));

export default useUserStore;