import { StateCreator } from 'zustand';
import { AppState } from '../store';
import { UserDto } from '~/DTOs/UserDto';

export interface UserState {
	userData: UserDto | null;
	setUserData: (data: UserDto) => void;
	resetUserSlice: () => void;
}

const initialState: UserState = {
	userData: null,
	setUserData: () => {},
	resetUserSlice: () => {},
};

export const userSlice: StateCreator<AppState, [], [], UserState> = set => ({
	...initialState,
	setUserData: (data: UserDto) =>
		set({
			userData: { ...data },
		}),
	resetUserSlice: () => set(initialState),
});
