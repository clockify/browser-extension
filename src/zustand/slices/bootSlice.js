export const bootSlice = (set) => ({
	bootData: null,
	setBootData: (data) =>
		set({
			bootData: { ...data },
		}),
});
