export const uiSlice = (set) => ({
	bannerVisible: false,
	setBannerVisible: (isVisible) => set({ bannerVisible: isVisible }),
	emailEnforcedModalVisible: false,
	setEmailEnforcedModalVisible: (isVisible) =>
		set({ emailEnforcedModalVisible: isVisible }),
});
