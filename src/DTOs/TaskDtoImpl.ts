import { StatusEnum } from '~/enums/StatusEnum.ts';
import { RateDto } from '~/DTOs/RateDto.ts';
import { DurationDto } from '~/DTOs/DurationDto.ts';

export interface TaskDtoImpl {
	assigneeId: string;
	assigneeIds: Array<string>;
	billable: boolean;
	budgetEstimate: number;
	costRate: RateDto;
	estimate: DurationDto;
	hourlyRate: RateDto;
	id: string;
	name: string;
	progress: number;
	projectId: string;
	status: StatusEnum;
	userGroupIds: Array<string>;
	workspaceId: string;
}
