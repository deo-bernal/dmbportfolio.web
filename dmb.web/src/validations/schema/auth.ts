import * as Yup from "yup";

export const authSchema = Yup.object().shape({
  username: Yup.string().email("Enter a valid email address").max(255).required("The email field is required"),
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

const requiredTrimmed = (label: string, maxLen: number) =>
  Yup.string()
    .transform((v) => (typeof v === "string" ? v.trim() : v))
    .max(maxLen, `Must be at most ${maxLen} characters`)
    .required(`The ${label} field is required`)
    .test("not-empty", `The ${label} field is required`, (v) => Boolean(v && v.length > 0));

/** At least one lowercase, uppercase, digit, and non-alphanumeric (special) character. */
const COMPLEX_PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

export const registerSchema = Yup.object().shape({
  email: requiredTrimmed("email", 255).email("Enter a valid email address"),
  firstName: requiredTrimmed("first name", 100),
  lastName: requiredTrimmed("last name", 100),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .max(255, "The password is too long")
    .required("The password field is required")
    .matches(
      COMPLEX_PASSWORD_PATTERN,
      "Use uppercase, lowercase, a number, and a special character (e.g. !@#$%)"
    ),
  contactNumber: requiredTrimmed("contact number", 30),
});
