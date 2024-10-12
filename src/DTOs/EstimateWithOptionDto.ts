import { ResetOptionEnum } from '~/enums/ResetOptionEnum.ts';
import { TypeEnum } from '~/enums/TypeEnum.ts';

export interface EstimateWithOptionsDto {
	active?: boolean;
	estimate?: number;
	includeExpenses?: boolean;
	resetOption?: ResetOptionEnum;
	type?: TypeEnum;
}
