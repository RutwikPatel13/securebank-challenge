"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { trpc } from "@/lib/trpc/client";

// Luhn algorithm to validate card numbers
function isValidCardNumber(cardNumber: string): boolean {
  // Remove any spaces or dashes
  const digits = cardNumber.replace(/[\s-]/g, "");

  // Must be all digits and 13-19 characters (standard card lengths)
  if (!/^\d{13,19}$/.test(digits)) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  // Loop through digits from right to left
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

// Card type detection with comprehensive prefix ranges
// Based on ISO/IEC 7812 and card network specifications
type CardType = "visa" | "mastercard" | "amex" | "discover" | "unknown";

function detectCardType(cardNumber: string): CardType {
  const digits = cardNumber.replace(/[\s-]/g, "");

  if (!digits || digits.length < 1) return "unknown";

  // Visa: Starts with 4, length 13, 16, or 19
  if (digits.startsWith("4")) {
    return "visa";
  }

  // American Express: Starts with 34 or 37, length 15
  if (digits.startsWith("34") || digits.startsWith("37")) {
    return "amex";
  }

  // Mastercard: 51-55 or 2221-2720
  const first2 = parseInt(digits.substring(0, 2), 10);
  const first4 = parseInt(digits.substring(0, 4), 10);

  if ((first2 >= 51 && first2 <= 55) || (first4 >= 2221 && first4 <= 2720)) {
    return "mastercard";
  }

  // Discover: 6011, 622126-622925, 644-649, 65
  if (digits.startsWith("6011") || digits.startsWith("65")) {
    return "discover";
  }
  const first6 = parseInt(digits.substring(0, 6), 10);
  if (first6 >= 622126 && first6 <= 622925) {
    return "discover";
  }
  const first3 = parseInt(digits.substring(0, 3), 10);
  if (first3 >= 644 && first3 <= 649) {
    return "discover";
  }

  return "unknown";
}

function isValidCardType(cardNumber: string): { valid: boolean; cardType: CardType; message?: string } {
  const cardType = detectCardType(cardNumber);

  if (cardType === "unknown") {
    return {
      valid: false,
      cardType,
      message: "Unsupported card type. We accept Visa, Mastercard, American Express, and Discover.",
    };
  }

  return { valid: true, cardType };
}

interface FundingModalProps {
  accountId: number;
  onClose: () => void;
  onSuccess: () => void;
}

type FundingFormData = {
  amount: string;
  fundingType: "card" | "bank";
  accountNumber: string;
  routingNumber?: string;
};

export function FundingModal({ accountId, onClose, onSuccess }: FundingModalProps) {
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FundingFormData>({
    defaultValues: {
      fundingType: "card",
    },
  });

  const fundingType = watch("fundingType");
  const fundAccountMutation = trpc.account.fundAccount.useMutation();

  const onSubmit = async (data: FundingFormData) => {
    setError("");

    try {
      const amount = parseFloat(data.amount);

      await fundAccountMutation.mutateAsync({
        accountId,
        amount,
        fundingSource: {
          type: data.fundingType,
          accountNumber: data.accountNumber,
          routingNumber: data.routingNumber,
        },
      });

      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fund account");
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Fund Your Account</h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                {...register("amount", {
                  required: "Amount is required",
                  pattern: {
                    // Reject multiple leading zeros (e.g., "00100" or "007.50")
                    // Allow: "0.50", "100", "100.00", "0"
                    value: /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/,
                    message: "Invalid amount format (no leading zeros allowed)",
                  },
                  validate: {
                    minAmount: (value) => {
                      const num = parseFloat(value);
                      return num >= 0.01 || "Amount must be at least $0.01";
                    },
                    maxAmount: (value) => {
                      const num = parseFloat(value);
                      return num <= 10000 || "Amount cannot exceed $10,000";
                    },
                  },
                })}
                type="text"
                className="pl-7 block w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                placeholder="0.00"
              />
            </div>
            {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Funding Source</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input {...register("fundingType")} type="radio" value="card" className="mr-2" />
                <span>Credit/Debit Card</span>
              </label>
              <label className="flex items-center">
                <input {...register("fundingType")} type="radio" value="bank" className="mr-2" />
                <span>Bank Account</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {fundingType === "card" ? "Card Number" : "Account Number"}
            </label>
            <input
              {...register("accountNumber", {
                required: `${fundingType === "card" ? "Card" : "Account"} number is required`,
                pattern: {
                  value: fundingType === "card" ? /^\d{13,19}$/ : /^\d+$/,
                  message: fundingType === "card" ? "Card number must be 13-19 digits" : "Invalid account number",
                },
                validate: {
                  validCard: (value) => {
                    if (fundingType !== "card") return true;
                    // Check card type using comprehensive prefix detection
                    const cardTypeResult = isValidCardType(value);
                    if (!cardTypeResult.valid) {
                      return cardTypeResult.message;
                    }
                    // Validate using Luhn algorithm
                    if (!isValidCardNumber(value)) {
                      return "Invalid card number (failed checksum)";
                    }
                    return true;
                  },
                },
              })}
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              placeholder={fundingType === "card" ? "1234567812345678" : "123456789"}
            />
            {errors.accountNumber && <p className="mt-1 text-sm text-red-600">{errors.accountNumber.message}</p>}
          </div>

          {fundingType === "bank" && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Routing Number</label>
              <input
                {...register("routingNumber", {
                  required: "Routing number is required",
                  pattern: {
                    value: /^\d{9}$/,
                    message: "Routing number must be 9 digits",
                  },
                })}
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                placeholder="123456789"
              />
              {errors.routingNumber && <p className="mt-1 text-sm text-red-600">{errors.routingNumber.message}</p>}
            </div>
          )}

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={fundAccountMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {fundAccountMutation.isPending ? "Processing..." : "Fund Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
