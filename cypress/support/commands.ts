/// <reference types="cypress" />

// ***********************************************
// Custom commands for SecureBank testing
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login with email and password
       * @example cy.login('test@example.com', 'password123')
       */
      login(email: string, password: string): Chainable<void>;

      /**
       * Custom command to register a new user
       * @example cy.register({ firstName: 'John', lastName: 'Doe', ... })
       */
      register(userData: RegisterData): Chainable<void>;

      /**
       * Custom command to clear the database
       * @example cy.clearDatabase()
       */
      clearDatabase(): Chainable<void>;

      /**
       * Custom command to check if user is on dashboard
       * @example cy.shouldBeOnDashboard()
       */
      shouldBeOnDashboard(): Chainable<void>;
    }
  }
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  dateOfBirth?: string;
  ssn?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
});

// Register command (simplified - can be expanded for multi-step form)
Cypress.Commands.add('register', (userData: RegisterData) => {
  cy.visit('/signup');
  // Step 1: Personal Info
  cy.get('input[name="firstName"]').type(userData.firstName);
  cy.get('input[name="lastName"]').type(userData.lastName);
  cy.get('input[name="email"]').type(userData.email);
  cy.get('input[name="phone"]').type(userData.phone || '555-123-4567');
  cy.get('input[name="dateOfBirth"]').type(userData.dateOfBirth || '1990-01-01');
  cy.contains('button', 'Next').click();

  // Step 2: Address (if applicable)
  if (userData.address) {
    cy.get('input[name="address"]').type(userData.address);
    cy.get('input[name="city"]').type(userData.city || 'New York');
    cy.get('input[name="state"]').type(userData.state || 'NY');
    cy.get('input[name="zipCode"]').type(userData.zipCode || '10001');
    cy.contains('button', 'Next').click();
  }

  // Step 3: Security
  cy.get('input[name="ssn"]').type(userData.ssn || '123-45-6789');
  cy.get('input[name="password"]').type(userData.password);
  cy.get('input[name="confirmPassword"]').type(userData.confirmPassword);
  cy.contains('button', 'Create Account').click();
});

// Clear database command
Cypress.Commands.add('clearDatabase', () => {
  cy.exec('npm run db:clear', { failOnNonZeroExit: false });
});

// Should be on dashboard command
Cypress.Commands.add('shouldBeOnDashboard', () => {
  cy.url().should('include', '/dashboard');
  cy.contains('Dashboard').should('be.visible');
});

export {};

