import { StateCreator } from 'zustand';
import { AppState } from '../store';

export interface BootState {
	bootData: any | null;
	setBootData: (data: any) => void;
}

export const bootSlice: StateCreator<AppState, [], [], BootState> = set => ({
	bootData: null,
	setBootData: data =>
		set({
			bootData: { ...data },
		}),
});
