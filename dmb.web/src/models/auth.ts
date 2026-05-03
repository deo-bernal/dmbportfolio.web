// DTO-aligned auth contracts (based on dmb.api Controllers + dmb.model Dtos).

export type LoginRequest = {
  username: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  contactNumber: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  token: string;
  newPassword: string;
  confirmPassword: string;
};

export type ActivateAccountRequest = {
  token: string;
};

export type LoginResponse = {
  token: string;
};

export type LogoutResponse = {
  message: string;
  username?: string | null;
};

// Page/form view models used by current components.
export type AuthFormValues = LoginRequest;
export type RegisterFormValues = RegisterRequest;
export type ForgotFormValues = ForgotPasswordRequest;

export type ResetFormValues = {
  newPassword: string;
  confirmPassword: string;
};

export type ActivateStatus = "loading" | "success" | "error";
