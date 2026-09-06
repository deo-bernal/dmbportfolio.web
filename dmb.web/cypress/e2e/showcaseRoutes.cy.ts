/// <reference types="cypress" />

describe("AI automation showcase routes", () => {
  it("renders the services funnel", () => {
    cy.visit("/ai-automation");
    cy.contains("h1", "AI systems that capture, qualify, and book your leads.");
    cy.contains("Submit this form and watch the automation run");
    cy.contains("button", "Send it through the pipeline");
  });

  it("renders the case study index and both write-ups", () => {
    cy.visit("/case-studies");
    cy.contains("h1", "Work you can open in another tab.");

    cy.visit("/case-studies/dmb-assistant");
    cy.contains("Incident two: the provider retired the model underneath me");

    cy.visit("/case-studies/ai-profile-builder");
    cy.contains("The bug worth writing down");
  });

  it("sends an unknown case study back to the index", () => {
    cy.visit("/case-studies/does-not-exist");
    cy.location("pathname").should("eq", "/case-studies");
  });

  it("renders the stack page with both honesty groups", () => {
    cy.visit("/stack");
    cy.contains("Running in production right now");
    cy.contains("Comfortable, and quick to get productive");
  });

  it("is not swallowed by the /:username public profile catch-all", () => {
    cy.visit("/ai-automation");
    cy.location("pathname").should("eq", "/ai-automation");
    cy.contains("Six pieces, one working system");
  });

  it("posts the funnel form to the lead endpoint", () => {
    cy.intercept("POST", "/api/leads", {
      statusCode: 201,
      body: { message: "Thanks — your request is in.", bookingUrl: "https://cal.com/deo-bernal/30min" },
    }).as("createLead");

    cy.visit("/ai-automation");
    cy.get("input[type=email]").first().type("cypress@example.com");
    cy.contains("label", "Name")
      .parent()
      .find("input")
      .type("Cypress Check");
    cy.contains("button", "Send it through the pipeline").click();

    cy.wait("@createLead").its("request.body").should((body) => {
      expect(body.email).to.eq("cypress@example.com");
      expect(body.source).to.eq("funnel-form");
      expect(body.website).to.eq("");
    });

    cy.contains("Thanks — your request is in.");
    cy.contains("a", "Email to book a time");
  });
});
