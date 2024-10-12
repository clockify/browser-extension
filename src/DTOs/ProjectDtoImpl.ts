import { RateDto } from '~/DTOs/RateDto.ts';
import { DurationDto } from '~/DTOs/DurationDto.ts';
import { EstimateWithOptionsDto } from '~/DTOs/EstimateWithOptionDto.ts';
import { EstimateDto } from '~/DTOs/EstimateDto.ts';
import { MembershipDto } from '~/DTOs/MembershipDto.ts';
import { TimeEstimateDto } from '~/DTOs/TimeEstimateDto.ts';

export interface ProjectDtoImpl {
	archived: boolean;
	billable: boolean;
	budgetEstimate: EstimateWithOptionsDto;
	clientId: string;
	clientName: string;
	color: string;
	costRate: RateDto;
	duration: DurationDto;
	estimate: EstimateDto;
	hourlyRate: RateDto;
	id: string;
	memberships: MembershipDto[];
	name: string;
	note: string;
	_public: boolean;
	template: boolean;
	timeEstimate: TimeEstimateDto;
	workspaceId: string;
}
