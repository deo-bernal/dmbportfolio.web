describe("Login and portfolio flow", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("logs in and shows profile data", () => {
    cy.intercept("POST", "**/auth/login", {
      statusCode: 200,
      body: { token: "fake-jwt-token" },
    }).as("loginRequest");

    cy.intercept("GET", "**/profile", {
      statusCode: 200,
      body: {
        name: "Deo Bernal",
        summary: "Software developer",
        video: "https://go.screenpal.com/watch/cOflXKnOnrx",
        skills: ["React", "TypeScript", ".NET"],
        projectCategories: [
          {
            title: "Web Apps",
            items: [{ name: "Portfolio", description: "Personal website" }],
          },
        ],
        contact: { email: "deo@example.com", phone: "123 456 7890" },
      },
    }).as("profileRequest");

    cy.visit("/");

    cy.get("#login-username").type("admin11");
    cy.get("#login-password").type("password79");
    cy.contains("button", "Login").click();

    cy.wait("@loginRequest");
    cy.wait("@profileRequest");

    cy.get('[data-testid="profile-name"]').should("have.text", "Deo Bernal");
    cy.contains("h2", "Skills").should("be.visible");
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
    cy.contains("button", "Login").click();

    cy.wait("@loginRequest");
    cy.contains("Invalid username or password.").should("be.visible");
  });
});