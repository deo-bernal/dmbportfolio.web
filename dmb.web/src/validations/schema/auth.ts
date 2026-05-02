import * as Yup from "yup";

export const authSchema = Yup.object().shape({
  username: Yup.string().max(255).required("The username field is required"),
  password: Yup.string().max(255).required("The password field is required"),
});

export const forgotPasswordSchema = Yup.object().shape({
  email: Yup.string().email("Enter a valid email address").max(255).required("The email field is required"),
});

export const resetPasswordSchema = Yup.object().shape({
  newPassword: Yup.string().min(6, "Password must be at least 6 characters").max(255).required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "Passwords must match")
    .required("Confirm your password"),
});
