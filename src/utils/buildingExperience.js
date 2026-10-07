export const getBuildingExperience = (current = {}, requirements = {}) => {
    const required = Number(requirements.exp_for_levelup || 0);
    if (current.exp === undefined && required <= 0) return null;
    const experience = Number(current.exp || 0);
    return { current: experience, required, enough: experience >= required,
        missing: Math.max(0, required - experience) };
};
