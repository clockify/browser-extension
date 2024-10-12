import { UserStatusEnum } from '~/enums/UserStatusEnum.ts';
import { MembershipDto } from '~/DTOs/MembershipDto.ts';
import { UserSettingsDto } from '~/DTOs/UserSettingsDto.ts';

export interface UserDto {
	activeWorkspace: string;
	defaultWorkspace: string;
	email: string;
	id: string;
	memberships: MembershipDto[];
	name: string;
	profilePicture: string;
	settings: UserSettingsDto;
	status: UserStatusEnum;
}
