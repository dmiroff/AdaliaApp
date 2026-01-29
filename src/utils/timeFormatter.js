export const formatTime = (minutes) => {
    if (!minutes) return '0 минут';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    let result = '';
    if (hours > 0) {
        const hourWord = hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов';
        result += `${hours} ${hourWord}`;
    }
    if (mins > 0) {
        if (result) result += ' ';
        const minWord = mins === 1 ? 'минута' : mins < 5 ? 'минуты' : 'минут';
        result += `${mins} ${minWord}`;
    }
    return result || '0 минут';
};