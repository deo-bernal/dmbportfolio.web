describe("Auth routes", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("renders register page and validates required fields", () => {
    cy.visit("/register");

    cy.contains("h2", "Create account").should("be.visible");
    cy.contains("button", "Register").click();

    cy.contains("The email field is required").should("be.visible");
    cy.contains("The first name field is required").should("be.visible");
    cy.contains("The last name field is required").should("be.visible");
    cy.contains("The password field is required").should("be.visible");
    cy.contains("The contact number field is required").should("be.visible");
  });

  it("shows API offline message on login request failure", () => {
    cy.intercept("POST", "**/auth/login", { forceNetworkError: true }).as("loginError");

    cy.visit("/login");

    cy.get("#login-username").type("demo@demo.com");
    cy.get("#login-password").type("password79");
    cy.contains("button", "Sign in").click();

    cy.wait("@loginError");
    cy.contains("Unable to reach API. Check API URL and backend status.").should("be.visible");
  });
});

