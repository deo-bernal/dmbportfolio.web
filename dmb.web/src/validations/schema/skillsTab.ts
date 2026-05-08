import * as Yup from "yup";

export const skillsTabSchema = Yup.object({
  skills: Yup.array()
    .of(
      Yup.string()
        .transform((value) => (typeof value === "string" ? value.trim() : value))
        .required("Skill is required")
        .test("not-empty", "Skill is required", (value) => Boolean(value && value.length > 0))
    )
    .min(1, "At least one skill is required")
    .required("Skills are required"),
});

export const addSkillSchema = Yup.object({
  newSkill: Yup.string()
    .transform((value) => (typeof value === "string" ? value.trim() : value))
    .required("New skill is required")
    .test("not-empty", "New skill is required", (value) => Boolean(value && value.length > 0)),
});
