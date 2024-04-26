import useWorkspaceStore from './stores/workspaceStore';
import useUserStore from './stores/userStore';
import useUIStore from './stores/UIStore';
import useBootStore from './stores/bootStore';

const useCombinedStore = () => {
	const workspaceStore = useWorkspaceStore();
	const userStore = useUserStore();
	const UIStore = useUIStore();
	const bootStore = useBootStore();
	return { ...workspaceStore, ...userStore, ...UIStore, ...bootStore};
}

export default useCombinedStore;