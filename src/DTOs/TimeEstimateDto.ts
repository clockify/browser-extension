import { TypeEnum } from '~/enums/TypeEnum.ts';
import { ResetOptionEnum } from '~/enums/ResetOptionEnum.ts';
import { DurationDto } from '~/DTOs//DurationDto.ts';

export interface TimeEstimateDto {
	active: boolean;
	estimate: DurationDto;
	includeNonBillable: boolean;
	resetOption: ResetOptionEnum;
	type: TypeEnum;
}
