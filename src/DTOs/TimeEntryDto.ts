import { ProjectDto } from '~/DTOs/ProjectDto.ts';
import { TaskDto } from '~/DTOs/TaskDto.ts';
import { TagDto } from '~/DTOs/TagDto.ts';

export interface TimeEntryDto {
	project: ProjectDto;
	task: TaskDto;
	billable: boolean;
	id: string;
	description: string;
	tags: TagDto[];
	projectId: string;
	projectName: string;
	projectColor: string;
	clientId: string;
	clientName: string;
	taskId: string;
	taskName: string;
	projectBillable: boolean;
	billableBasedOnCurrentTaskAndProject: boolean;
}
