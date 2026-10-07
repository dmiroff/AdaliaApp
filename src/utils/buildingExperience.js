export const getBuildingExperience = (current = {}, requirements = {}) => {
    const building = current ?? {};
    const levelRequirements = requirements ?? {};
    const required = Number(levelRequirements.exp_for_levelup || 0);
    if (building.exp === undefined && required <= 0) return null;
    const experience = Number(building.exp || 0);
    return { current: experience, required, enough: experience >= required,
        missing: Math.max(0, required - experience) };
};
