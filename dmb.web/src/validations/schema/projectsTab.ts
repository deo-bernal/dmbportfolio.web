import * as Yup from "yup";

export const addCategorySchema = Yup.object({
  categoryName: Yup.string()
    .transform((value) => (typeof value === "string" ? value.trim() : value))
    .required("Category name is required")
    .test("not-empty", "Category name is required", (value) => Boolean(value && value.length > 0)),
});

export const addProjectItemSchema = Yup.object({
  projectName: Yup.string()
    .transform((value) => (typeof value === "string" ? value.trim() : value))
    .required("Project name is required")
    .test("not-empty", "Project name is required", (value) => Boolean(value && value.length > 0)),
  projectDescription: Yup.string()
    .transform((value) => (typeof value === "string" ? value.trim() : value))
    .required("Project description is required")
    .test("not-empty", "Project description is required", (value) => Boolean(value && value.length > 0)),
});

export const projectsTabSchema = Yup.object({
  projectCategories: Yup.array()
    .of(
      Yup.object({
        title: Yup.string()
          .transform((value) => (typeof value === "string" ? value.trim() : value))
          .required("Category title is required")
          .test("not-empty", "Category title is required", (value) => Boolean(value && value.length > 0)),
        items: Yup.array()
          .of(
            Yup.object({
              name: Yup.string()
                .transform((value) => (typeof value === "string" ? value.trim() : value))
                .required("Project name is required")
                .test("not-empty", "Project name is required", (value) => Boolean(value && value.length > 0)),
              description: Yup.string()
                .transform((value) => (typeof value === "string" ? value.trim() : value))
                .required("Project description is required")
                .test(
                  "not-empty",
                  "Project description is required",
                  (value) => Boolean(value && value.length > 0)
                ),
            })
          )
          .min(1, "At least one project item is required")
          .required("Project items are required"),
      })
    )
    .min(1, "At least one category is required")
    .required("Project categories are required"),
});
