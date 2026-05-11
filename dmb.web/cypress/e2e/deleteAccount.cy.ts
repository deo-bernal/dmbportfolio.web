describe("Delete account", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("deletes account from overview tab after confirmation", () => {
    cy.intercept("POST", "**/auth/login", {
      statusCode: 200,
      body: { token: "fake-jwt-token" },
    }).as("loginRequest");

    cy.intercept("GET", "**/profiledetails", {
      statusCode: 200,
      body: {
        userId: 1,
        username: "deo@example.com",
        firstName: "Deo",
        lastName: "Bernal",
        email: "deo@example.com",
        contactNo: "123 456 7890",
        activated: true,
        isViewable: true,
        createdAt: "2026-01-01T00:00:00Z",
        userDetails: {
          userDetailsId: 1,
          userId: 1,
          description: "Software developer",
          skills: "React,TypeScript,.NET",
          video: "https://go.screenpal.com/watch/cOflXKnOnrx",
          createdAt: "2026-01-01T00:00:00Z",
        },
        projects: [],
      },
    }).as("profileRequest");

    cy.intercept("DELETE", "**/account", {
      statusCode: 200,
      body: { message: "Account deleted successfully." },
    }).as("deleteAccountRequest");

    cy.visit("/");

    cy.get("#login-username").type("admin11");
    cy.get("#login-password").type("password79");
    cy.contains("button", "Sign in").click();

    cy.wait("@loginRequest");
    cy.wait("@profileRequest");

    cy.contains("button", "Edit portfolio").click();
    cy.contains("button", "Delete Account").click();
    cy.contains("h2", "Delete Account").should("be.visible");
    cy.contains("button", "Delete Account").last().click();

    cy.wait("@deleteAccountRequest");
    cy.url().should("include", "/login");
  });
});

