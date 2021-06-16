const defaultProjectEnums = {
    'LAST_USED_PROJECT': 'lastUsedProject',
    'DEFAULT_PROJECTS': 'defaultProjects',
    'DEFAULT_PROJECTS_ENABLED': 'defaultProjectsEnabled',
    // pomodoro break
    'POMODORO_BREAK_DEFAULT_PROJECTS': 'PomodoroBreakDefaultProjects',
};
Object.freeze(defaultProjectEnums);

export function getDefaultProjectEnums() {
    return defaultProjectEnums;
}