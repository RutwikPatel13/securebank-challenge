/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { expect as jestExpect } from "@jest/globals";

// Mock the trpc client
jest.mock("@/lib/trpc/client", () => ({
  trpc: {
    account: {
      getTransactions: {
        useQuery: jest.fn(),
      },
    },
  },
}));

import { TransactionList } from "@/components/TransactionList";
import { trpc } from "@/lib/trpc/client";

describe("TransactionList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state", () => {
    (trpc.account.getTransactions.useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(<TransactionList accountId={1} />);
    jestExpect(screen.getByText("Loading transactions...")).toBeTruthy();
  });

  it("renders empty state when no transactions", () => {
    (trpc.account.getTransactions.useQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<TransactionList accountId={1} />);
    jestExpect(screen.getByText("No transactions yet.")).toBeTruthy();
  });

  it("renders transaction description as plain text (XSS prevention)", () => {
    const maliciousDescription = '<script>alert("XSS")</script>';

    (trpc.account.getTransactions.useQuery as jest.Mock).mockReturnValue({
      data: [
        {
          id: 1,
          accountId: 1,
          type: "deposit",
          amount: 100,
          description: maliciousDescription,
          status: "completed",
          createdAt: "2024-01-15T10:00:00Z",
        },
      ],
      isLoading: false,
    });

    render(<TransactionList accountId={1} />);

    // The script tag should be rendered as escaped text, not executed
    // Check that the malicious content is displayed as text, not as HTML
    const descriptionCell = screen.getByText(maliciousDescription);
    jestExpect(descriptionCell).toBeTruthy();

    // Ensure no script tags are actually in the DOM
    jestExpect(document.querySelector("script")).toBe(null);
  });

  it("renders transaction with safe description correctly", () => {
    (trpc.account.getTransactions.useQuery as jest.Mock).mockReturnValue({
      data: [
        {
          id: 1,
          accountId: 1,
          type: "deposit",
          amount: 500,
          description: "Funding from card",
          status: "completed",
          createdAt: "2024-01-15T10:00:00Z",
        },
      ],
      isLoading: false,
    });

    render(<TransactionList accountId={1} />);

    jestExpect(screen.getByText("Funding from card")).toBeTruthy();
    jestExpect(screen.getByText("+$500.00")).toBeTruthy();
    jestExpect(screen.getByText("deposit")).toBeTruthy();
    jestExpect(screen.getByText("completed")).toBeTruthy();
  });

  it("renders dash when description is null", () => {
    (trpc.account.getTransactions.useQuery as jest.Mock).mockReturnValue({
      data: [
        {
          id: 1,
          accountId: 1,
          type: "deposit",
          amount: 100,
          description: null,
          status: "completed",
          createdAt: "2024-01-15T10:00:00Z",
        },
      ],
      isLoading: false,
    });

    render(<TransactionList accountId={1} />);
    jestExpect(screen.getByText("-")).toBeTruthy();
  });
});

