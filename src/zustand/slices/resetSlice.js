import { userSlice } from '~/zustand/slices/userSlice';

export const resetAllSlices = (set) => ({
	resetSlices: () => {
		userSlice(set).resetUserSlice();
	},
});
