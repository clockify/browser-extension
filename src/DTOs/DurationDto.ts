import { TemporalUnitDto } from '~/DTOs/TemporalUnitDto.ts';

export interface DurationDto {
	nano: number;
	negative: boolean;
	seconds: number;
	units: TemporalUnitDto[];
	zero: boolean;
}
