describe('Smoke Tests', () => {
  beforeEach(() => {
    // Clear any existing state
  });

  it('should load the home page', () => {
    cy.visit('/');
    cy.contains('SecureBank').should('be.visible');
  });

  it('should navigate to login page', () => {
    cy.visit('/');
    cy.contains('Sign In').click();
    cy.url().should('include', '/login');
  });

  it('should navigate to signup page', () => {
    cy.visit('/');
    cy.contains('Open an Account').click();
    cy.url().should('include', '/signup');
  });

  it('should display login form', () => {
    cy.visit('/login');
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });
});

