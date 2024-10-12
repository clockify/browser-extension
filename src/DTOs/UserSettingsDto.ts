import { DashboardSelectionEnum } from '~/enums/DashboardSelectionEnum.ts';
import { DashboardViewTypeEnum } from '~/enums/DashboardViewTypeEnum.ts';
import { ThemeEnum } from '~/enums/ThemeEnum.ts';
import { WeekStatusEnum } from '~/enums/WeekStatusEnum.ts';
import { SummaryReportSettingsDto } from '~/DTOs/SummaryReportSettingsDto.ts';

export interface UserSettingsDto {
	alerts: boolean;
	approval: boolean;
	collapseAllProjectLists: boolean;
	darkTheme: boolean;
	dashboardPinToTop: boolean;
	dashboardSelection: DashboardSelectionEnum;
	dashboardViewType: DashboardViewTypeEnum;
	dateFormat: string;
	groupSimilarEntriesDisabled: boolean;
	isCompactViewOn: boolean;
	lang: string;
	longRunning: boolean;
	multiFactorEnabled: boolean;
	myStartOfDay: string;
	onboarding: boolean;
	projectListCollapse: number;
	projectPickerSpecialFilter: boolean;
	pto: boolean;
	reminders: boolean;
	scheduledReports: boolean;
	scheduling: boolean;
	sendNewsletter: boolean;
	showOnlyWorkingDays: boolean;
	summaryReportSettings: SummaryReportSettingsDto;
	theme: ThemeEnum;
	timeFormat: string;
	timeTrackingManual: boolean;
	timeZone: string;
	weekStart: WeekStatusEnum;
	weeklyUpdates: boolean;
}
