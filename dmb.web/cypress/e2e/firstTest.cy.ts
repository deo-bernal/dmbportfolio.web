describe("Login and portfolio flow", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("logs in and shows profile data", () => {
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

    cy.visit("/");

    cy.get("#login-username").type("admin11");
    cy.get("#login-password").type("password79");
    cy.contains("button", "Sign in").click();

    cy.wait("@loginRequest");
    cy.wait("@profileRequest");

    cy.get('[data-testid="profile-name"]').should("have.text", "Deo Bernal");
    cy.contains("button", "Edit portfolio").should("be.visible");
    cy.contains("button", "Log out").should("be.visible");
  });

  it("shows an error for invalid credentials", () => {
    cy.intercept("POST", "**/auth/login", {
      statusCode: 401,
      body: { message: "Unauthorized" },
    }).as("loginRequest");

    cy.visit("/");

    cy.get("#login-username").type("wrong-user");
    cy.get("#login-password").type("wrong-pass");
    cy.contains("button", "Sign in").click();

    cy.wait("@loginRequest");
    cy.contains("Unauthorized").should("be.visible");
  });
});