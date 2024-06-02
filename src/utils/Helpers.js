const classDataToDict = (classData) => {
    const dict = {};
    Object.keys(classData).forEach(key => {
      dict[key] = classData[key];
    });
    return dict;
  };

export default classDataToDict;