import { RateDto } from '~/DTOs/RateDto.ts';
import { StatusEnum } from '~/enums/StatusEnum.ts';

export interface TaskDto {
	id: string;
	name: string;
	projectId: string;
	workspaceId: string;
	assigneeIds: string[];
	userGroupIds: string[];
	estimate: string;
	status: StatusEnum;
	budgetEstimate: number;
	billable: boolean;
	hourlyRate: RateDto;
	costRate: RateDto;
	progress: number;
	favorite: boolean;
}
