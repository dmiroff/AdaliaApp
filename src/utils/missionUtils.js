export const safeToString = (value) => {
  if (value == null) return '';
  
  if (typeof value === 'object') {
    if (value.msg) {
      return value.msg;
    }
    else if (value.message) {
      return value.message;
    }
    else if (Array.isArray(value)) {
      return value.map(item => safeToString(item)).join(', ');
    }
    else {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
  }
  
  return String(value);
};

export const translateSkill = (skill) => {
  const skillTranslations = {
    'assasin': 'Убийца',
    'assassin': 'Убийца',
    'diversion': 'Диверсант',
    'spy': 'Шпион',
    'scout': 'Разведчик',
    'sabotage': 'Саботаж',
    'thief': 'Вор',
    'rogue': 'Плут',
    'ninja': 'Ниндзя',
    'mercenary': 'Наёмник',
    'hunter': 'Охотник'
  };
  
  return skillTranslations[skill] || skill;
};

export const getSkillIcon = (skill) => {
  const skillIcons = {
    'assasin': '🗡️',
    'assassin': '🗡️',
    'diversion': '💣',
    'spy': '🕵️',
    'scout': '🔍',
    'sabotage': '🔥',
    'thief': '🦹',
    'rogue': '🎭',
    'ninja': '🥷',
    'mercenary': '⚔️',
    'hunter': '🏹'
  };
  
  return skillIcons[skill] || '⭐';
};

export const getRegionInfo = (regionId, regionsInfo = []) => {
  if (regionsInfo && regionsInfo.length > 0) {
    const region = regionsInfo.find(r => r.id === regionId);
    if (region) {
      const icons = {
        forest: '🌲',
        steppe: '🌾',
        mountains: '⛰️',
        coast: '🏖️'
      };
      
      const colors = {
        forest: 'success',
        steppe: 'warning',
        mountains: 'secondary',
        coast: 'info'
      };
      
      return {
        id: region.id,
        name: region.name || regionId,
        icon: icons[regionId] || '❓',
        color: colors[regionId] || 'light'
      };
    }
  }
  
  const regions = {
    forest: { 
      name: 'Лес', 
      icon: '🌲', 
      color: 'success'
    },
    steppe: { 
      name: 'Степь', 
      icon: '🌾', 
      color: 'warning'
    },
    mountains: { 
      name: 'Горы', 
      icon: '⛰️', 
      color: 'secondary'
    },
    coast: { 
      name: 'Побережье', 
      icon: '🏖️', 
      color: 'info'
    }
  };
  return regions[regionId] || { 
    name: regionId, 
    icon: '❓', 
    color: 'light'
  };
};

export const getAgentTypeInfo = (type) => {
  const types = {
    scout: { 
      name: 'Разведчик',
      icon: '🕵️',
      description: 'Исследует регион в поисках ресурсов или поселений',
      duration: '2-6 часов',
      requiredSkill: 'Убийца или Диверсант'
    },
    assassin: { 
      name: 'Убийца',
      icon: '🗡️',
      description: 'Пытается убить лидера вражеского поселения',
      duration: '6-12 часов',
      requiredSkill: 'Убийца'
    },
    saboteur: { 
      name: 'Диверсант',
      icon: '💣',
      description: 'Подрывает ресурсы вражеского поселения',
      duration: '4-8 часов',
      requiredSkill: 'Диверсант'
    }
  };
  return types[type] || types.scout;
};

export const getMissionStatusBadge = (status) => {
  const statuses = {
    active: { variant: 'success', text: 'В процессе', icon: 'fa-running' },
    completed: { variant: 'primary', text: 'Завершена', icon: 'fa-check-circle' },
    failed: { variant: 'danger', text: 'Провалена', icon: 'fa-times-circle' },
    pending: { variant: 'warning', text: 'Ожидает', icon: 'fa-clock' }
  };
  return statuses[status] || statuses.pending;
};

export const formatTimeRemaining = (endTime) => {
  if (!endTime) return null;
  const now = new Date();
  const end = new Date(endTime);
  const diffMs = end - now;
  
  if (diffMs <= 0) return "Завершено";
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}ч ${minutes}м`;
};