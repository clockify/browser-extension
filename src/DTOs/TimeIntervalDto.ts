import { DurationDto } from '~/DTOs/DurationDto.ts';

export interface TimeIntervalDto {
	duration: DurationDto;
	end: Date;
	start: Date;
}
