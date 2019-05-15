const defaultProjectEnums = {
    'LAST_USED_PROJECT': 'lastUsedProject',
    'DEFAULT_PROJECTS': 'defaultProjects',
    'DEFAULT_PROJECTS_ENABLED': 'defaultProjectsEnabled'
};
Object.freeze(defaultProjectEnums);

export function getDefaultProjectEnums() {
    return defaultProjectEnums;
}