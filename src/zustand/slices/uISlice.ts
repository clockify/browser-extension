import { StateCreator } from 'zustand';
import { AppState } from '../store';

export interface UIState {
	bannerVisible: boolean;
	setBannerVisible: (isVisible: boolean) => void;
	emailEnforcedModalVisible: boolean;
	setEmailEnforcedModalVisible: (isVisible: boolean) => void;
}

export const uiSlice: StateCreator<AppState, [], [], UIState> = set => ({
	bannerVisible: false,
	setBannerVisible: isVisible => set({ bannerVisible: isVisible }),
	emailEnforcedModalVisible: false,
	setEmailEnforcedModalVisible: isVisible => set({ emailEnforcedModalVisible: isVisible }),
});
