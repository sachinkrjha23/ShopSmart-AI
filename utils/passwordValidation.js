
export const validatePassword = (password) => {
  const errors = [];
  
  if (!password) {
    errors.push("Password is required.");
    return errors;
  }
  
  if (password.length < 8 || password.length > 16) {
    errors.push("Password must be between 8 and 16 characters.");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter.");
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter.");
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number.");
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character.");
  }
  
  if (/\s/.test(password)) {
    errors.push("Password cannot contain spaces.");
  }
  
  return errors;
};