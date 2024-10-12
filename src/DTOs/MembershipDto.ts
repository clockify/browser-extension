import { RateDto } from './RateDto';
import { MembershipStatusEnum } from '~/enums/MembershipStatusEnum.ts';

export interface MembershipDto {
	costRate: RateDto;
	hourlyRate: RateDto;
	membershipStatus: MembershipStatusEnum;
	membershipType: string;
	targetId: string;
	userId: string;
}
