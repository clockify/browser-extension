import { create } from 'zustand';

const useUIStore = create(set => ({
	bannerVisible: false,
	setBannerVisible: (isVisible) => set({bannerVisible: isVisible}),
	emailEnforcedModalVisible: false,
	setEmailEnforcedModalVisible: (isVisible) => set({emailEnforcedModalVisible: isVisible}),
}));

export default useUIStore;