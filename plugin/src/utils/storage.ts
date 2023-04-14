const storage = {
  get: (key: string): any | null => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },

  set: (key: string, value: any): void => {
    return localStorage.setItem(key, JSON.stringify(value));
  },

  remove: (key: string): void => {
    return localStorage.removeItem(key);
  },
};

export default storage;
