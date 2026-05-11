import * as Yup from "yup";

function isValidIsoDate(value: string): boolean {
  // Expecting YYYY-MM-DD (what we store in state / send to API)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00`);
  return !Number.isNaN(d.getTime());
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateOnly(value: string): Date {
  // Assumes valid ISO date
  return new Date(`${value}T00:00:00`);
}

export type WorkHistoryFormValues = {
  company: string;
  position: string;
  fromDate?: string;
  toDate?: string;
  jobDescription?: string;
};

export const workHistoryItemFormSchema: Yup.ObjectSchema<WorkHistoryFormValues> = Yup.object({
  company: Yup.string().trim().required("Company is required."),
  position: Yup.string().trim().required("Position is required."),
  fromDate: Yup.string()
    .trim()
    .test("from-valid", "From date is invalid.", (value) => !value || isValidIsoDate(value))
    .test("from-on-or-before-today", "From date must be on or before today.", (value) => {
      if (!value) return true;
      if (!isValidIsoDate(value)) return true; // let the previous test surface the error
      return toDateOnly(value) <= startOfToday();
    }),
  toDate: Yup.string()
    .trim()
    .test("to-valid", "To date is invalid.", (value) => !value || isValidIsoDate(value))
    .test("to-on-or-before-today", "To date must be on or before today.", (value) => {
      if (!value) return true;
      if (!isValidIsoDate(value)) return true;
      return toDateOnly(value) <= startOfToday();
    })
    .test("after-from", "From date must be before To date.", function (value) {
      const parent = this.parent as WorkHistoryFormValues;
      const from = (parent.fromDate ?? "").trim();
      const to = (value ?? "").trim();
      if (!from || !to) return true;
      if (!isValidIsoDate(from) || !isValidIsoDate(to)) return true;
      return toDateOnly(from) < toDateOnly(to);
    }),
  jobDescription: Yup.string().trim().max(2000, "Job description is too long."),
}).required();

