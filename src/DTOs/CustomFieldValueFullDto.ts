import { CustomFieldDto } from '~/DTOs/CustomFieldDto.ts';

export interface CustomFieldValueFullDto {
	customFieldDto: CustomFieldDto;
	customFieldId: string;
	name: string;
	sourceType: string;
	timeEntryId: string;
	type: string;
	value: any;
}
