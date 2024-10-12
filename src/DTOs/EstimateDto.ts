import { DurationDto } from '~/DTOs/DurationDto.ts';
import { TypeEnum } from '~/enums/TypeEnum.ts';

export interface EstimateDto {
	estimate: DurationDto;
	type: TypeEnum;
}
