class TagService extends ClockifyService {
	constructor() {}

	static async getUrlTags() {
		const apiEndpoint = await this.apiEndpoint;
		const workspaceId = await this.workspaceId;
		return `${apiEndpoint}/v1/workspaces/${workspaceId}/tags`;
	}

	static async getOrCreateTags(tagNames) {
		const pageSize = 50;
		let allTags = [];
		let message = '';
		let page = 1;
		let pageTagsLength = 0;
		do {
			const {
				data: pageTags,
				error,
				status,
			} = await this.getAllTagsWithFilter(page, pageSize);
			if (status !== 200) {
				if (error) return { tagovi: [], message: error.message };
				break; //return [];
			}
			allTags = allTags.concat(
				pageTags.map((tag) => {
					return { id: tag.id, name: tag.name };
				})
			);
			page++;
			pageTagsLength = pageTags.length;
		} while (pageTagsLength === pageSize);

		const { forceTags } = await this.getForces();
		const tags = [];
		let notifyCanNotreateObjects = false;
		for (const tagName of tagNames) {
			const t = allTags.find(
				(e) => e.name.toUpperCase() === tagName.toUpperCase()
			);
			const createObjects = await this.getCreateObjects();
			const canCreateTags = await this.getCanCreateTags();
			if (t) {
				tags.push(t);
			} else if (createObjects && canCreateTags) {
				const {
					data: tag,
					error,
					status,
				} = await this.createTag({ name: tagName });
				if (status === 201) {
					tags.push(tag);
				} else {
					message += `\nCouldn't create tag: ${tagName}`;
				}
			} else {
				message += `\nCouldn't create tag: ${tagName}`;
				if (!createObjects) notifyCanNotreateObjects = true;
			}
		}
		if (notifyCanNotreateObjects)
			message += '\n Integrations can\'t create tags.';
		if (forceTags && tags.length !== tagNames.length)
			message += '\n Tags are required.';

		return { tagovi: tags, message };
	}

	static async getAllTagsWithFilter(page, pageSize, filter) {
		const urlTags = await this.getUrlTags();
		let endPoint = `${urlTags}?page=${page}&pagesize=${pageSize}&archived=false`;
		if (!!filter) {
			endPoint = endPoint.concat(`&name=${filter}`);
		}
		return await this.apiCall(endPoint);
	}

	static async createTag(tag) {
		const endPoint = await this.getUrlTags();
		const body = tag;
		return await this.apiCall(endPoint, 'POST', body);
	}
}
