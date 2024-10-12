import { CustomFieldDefaultValuesDto } from '~/DTOs/CustomFieldDefaultValuesDto.ts';

export interface CustomFieldDto {
	allowedValues: string[];
	description: string;
	entityType: string;
	id: string;
	name: string;
	onlyAdminCanEdit: boolean;
	placeholder: string;
	projectDefaultValues: CustomFieldDefaultValuesDto[];
	required: boolean;
	status: string;
	type: string;
	workspaceDefaultValue: any;
	workspaceId: string;
}
