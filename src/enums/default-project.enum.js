const defaultProjectEnums = {
	LAST_USED_PROJECT: 'lastUsedProject',
	LAST_USED_PROJECT_AND_TASK: 'lastUsedProjectAndTask',
	DEFAULT_PROJECTS: 'defaultProjects',
	DEFAULT_PROJECTS_ENABLED: 'defaultProjectsEnabled',
	// pomodoro break
	POMODORO_BREAK_DEFAULT_PROJECTS: 'PomodoroBreakDefaultProjects',
};
Object.freeze(defaultProjectEnums);

export function getDefaultProjectEnums() {
	return defaultProjectEnums;
}
