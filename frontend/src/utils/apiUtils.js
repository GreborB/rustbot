import { toast } from 'react-toastify';

export const withRetry = async (fn, options = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    shouldRetry = (error) => true,
    onError = (error) => {},
  } = options;

  let retryCount = 0;
  let lastError = null;

  while (retryCount <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      onError(error);
      
      if (retryCount === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      retryCount++;
      await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
    }
  }

  throw lastError;
};

export const handleApiError = (error) => {
  const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';
  toast.error(errorMessage);
  console.error('API Error:', error);
  return error;
};

export const safeLocalStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('LocalStorage Error:', error);
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('LocalStorage Error:', error);
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('LocalStorage Error:', error);
    }
  }
}; 