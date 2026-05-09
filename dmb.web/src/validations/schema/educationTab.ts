import * as Yup from "yup";

const trimOrEmpty = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const nonEmptyTrimmedString = (label: string) =>
  Yup.string()
    .transform(trimOrEmpty)
    .required(`${label} is required`)
    .test("not-empty", `${label} is required`, (value) => Boolean(value && value.length > 0));

const isoDateRequired = (label: string) =>
  Yup.string()
    .transform(trimOrEmpty)
    .required(`${label} is required`)
    .matches(/^\d{4}-\d{2}-\d{2}$/, `${label} must be a complete date`);

export const educationItemFormSchema = Yup.object({
  school: nonEmptyTrimmedString("School"),
  address: nonEmptyTrimmedString("Address"),
  courseTaken: nonEmptyTrimmedString("Course taken"),
  startDate: isoDateRequired("Start date"),
  endDate: isoDateRequired("End date"),
});
