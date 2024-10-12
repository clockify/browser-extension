import { DurationDto } from '~/DTOs/DurationDto.ts';

export interface TemporalUnitDto {
	dateBased: boolean;
	duration: DurationDto;
	durationEstimated: boolean;
	timeBased: boolean;
}
