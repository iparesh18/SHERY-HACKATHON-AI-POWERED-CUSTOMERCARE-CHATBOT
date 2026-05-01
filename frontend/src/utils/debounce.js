export const debounce = (callback, delay = 500) => {
  let timeoutId;
  let lastCallTime = 0;
  
  return (...args) => {
    const now = Date.now();
    
    if (now - lastCallTime < delay) {
      clearTimeout(timeoutId);
    }
    
    lastCallTime = now;
    timeoutId = setTimeout(() => {
      callback(...args);
    }, delay);
  };
};
