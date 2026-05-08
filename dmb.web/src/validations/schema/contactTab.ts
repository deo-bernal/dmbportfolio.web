import * as Yup from "yup";

export const contactTabSchema = Yup.object({
  email: Yup.string()
    .transform((value) => (typeof value === "string" ? value.trim() : value))
    .email("Enter a valid email address")
    .required("Email is required")
    .test("not-empty", "Email is required", (value) => Boolean(value && value.length > 0)),
  phone: Yup.string()
    .transform((value) => (typeof value === "string" ? value.trim() : value))
    .required("Phone is required")
    .test("not-empty", "Phone is required", (value) => Boolean(value && value.length > 0)),
});
