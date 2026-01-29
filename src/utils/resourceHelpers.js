export const getResourceInfo = (resourceId, RESOURCE_NAMES) => {
    const id = String(resourceId);
    
    if (!RESOURCE_NAMES || typeof RESOURCE_NAMES !== 'object') {
        return {
            name: `Ресурс ${id}`,
            icon: 'fas fa-coins',
            color: 'secondary'
        };
    }
    
    const resource = RESOURCE_NAMES[id];
    
    if (!resource) {
        return {
            name: `Ресурс ${id}`,
            icon: 'fas fa-coins',
            color: 'secondary'
        };
    }
    
    let resourceName = '';
    if (typeof resource === 'string') {
        resourceName = resource;
    } else if (typeof resource === 'object' && resource !== null) {
        if (resource.name) {
            resourceName = typeof resource.name === 'string' ? resource.name : String(resource.name);
        } else {
            resourceName = `Ресурс ${id}`;
        }
    }
    
    return {
        name: resourceName || `Ресурс ${id}`,
        icon: resource.icon || 'fas fa-coins',
        color: resource.color || 'secondary'
    };
};