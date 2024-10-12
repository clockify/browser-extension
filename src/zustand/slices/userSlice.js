const initialState = {
	userData: null,
};

export const userSlice = (set, get) => ({
	...initialState,
	setUserData: (data) =>
		set({
			userData: { ...data },
		}),

	resetUserSlice: () => set(initialState),
});
