import { TagDto } from '~/DTOs/TagDto.ts';
import { RateDto } from '~/DTOs/RateDto.ts';
import { CustomFieldValueFullDto } from '~/DTOs/CustomFieldValueFullDto.ts';
import { EntityIdNameDto } from '~/DTOs/EntityIdNameDto.ts';
import { ProjectDtoImpl } from '~/DTOs//ProjectDtoImpl.ts';
import { UserDto } from '~/DTOs/UserDto.ts';
import { TimeIntervalDto } from '~/DTOs/TimeIntervalDto.ts';
import { TaskDtoImpl } from '~/DTOs/TaskDtoImpl.ts';

export interface TimeEntryFullDto {
	approvalRequestId: string;
	billable: boolean;
	customFieldValues: CustomFieldValueFullDto[];
	description: string;
	hourlyRate: RateDto;
	id: string;
	isLocked: boolean;
	kiosk: EntityIdNameDto;
	kioskId: string;
	project: ProjectDtoImpl;
	projectId: string;
	tags: TagDto[];
	task: TaskDtoImpl;
	taskId: string;
	timeInterval: TimeIntervalDto;
	totalBillable: number;
	totalBillableDecimal: number;
	type: string;
	user: UserDto;
	userId: string;
	workspaceId: string;
}
