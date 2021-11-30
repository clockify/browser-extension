class TagService extends ClockifyService {

    constructor() {
    }

    static get urlTags() {
        return `${this.apiEndpoint}/v1/workspaces/${this.workspaceId}/tags`;
    }
  
    static async getOrCreateTags(tagNames) {
        const pageSize = 50;
        let allTags = [];
        let message = "";
        for (var page=1; page < 20; page++) {
            const { data: pageTags, error, status } = await this.getAllTagsWithFilter(page, pageSize);
            if (status !== 200) {
                if (error)
                    return { tagovi: [], message: error.message }
                break; //return [];
            }
            allTags = allTags.concat(pageTags.map(tag => { return { id: tag.id, name: tag.name}}) );
            if (pageTags.length < pageSize)
                break;
        }
        
        const { forceTags } = this.forces;
        const tags = [];
        let notifyCanNotreateObjects = false;
        for (const tagName of tagNames) {
            const t = allTags.find(e => e.name.toUpperCase() === tagName.toUpperCase());
            if (t) {
                tags.push(t);
            } 
            else if (this.createObjects) {
                const { data: tag, error, status } = await this.createTag({ name: tagName });
                if (status === 201) {
                    tags.push(tag);
                }
                else {
                    message += `\nCouldn't create tag: ${tagName}`;
                }
            }
            else {
                message += `\nCouldn't create tag: ${tagName}`;
                notifyCanNotreateObjects = true;
            }
        }
        if (notifyCanNotreateObjects)
            message += "\n Integrations can't create tags."
        if (forceTags && tags.length !== tagNames.length)
            message += "\n Tags are required."
    
        return { tagovi: tags, message };
    }


    static async getAllTagsWithFilter(page, pageSize, filter) {
        let endPoint = `${this.urlTags}?page=${page}&pagesize=${pageSize}&archived=false`;
        if (!!filter) {
            url = url.concat(`&name=${filter}`);
        }
        return await this.apiCall(endPoint);
    }

    static async createTag(tag) {
        const endPoint = this.urlTags;
        const body = tag;
        return await this.apiCall(endPoint, 'POST', body);
    }

}