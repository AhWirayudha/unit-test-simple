import "@testing-library/jest-dom";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import ChangePasswordPage from "../src/app/change-password/page";

// Mock react-hot-toast
const mockToast = {
  loading: jest.fn(() => "toast-id"),
  success: jest.fn(),
  error: jest.fn(),
};

jest.mock("react-hot-toast", () => ({
  toast: mockToast,
}));

// Mock fetch
global.fetch = jest.fn();

describe("ChangePasswordPage", () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    jest.clearAllMocks();
    // Clear the mock toast functions
    mockToast.loading.mockClear();
    mockToast.success.mockClear();
    mockToast.error.mockClear();
  });

  it("should render the change password form", () => {
    render(<ChangePasswordPage />);

    expect(screen.getByText("Change Password")).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /change password/i })
    ).toBeInTheDocument();
  });

  it("should show validation errors for empty fields", async () => {
    render(<ChangePasswordPage />);

    const submitButton = screen.getByRole("button", {
      name: /change password/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Email is required.")).toBeInTheDocument();
      expect(
        screen.getByText("Current password is required.")
      ).toBeInTheDocument();
      expect(screen.getByText("New password is required.")).toBeInTheDocument();
      expect(
        screen.getByText("Please confirm your new password.")
      ).toBeInTheDocument();
    });

    expect(fetch).not.toHaveBeenCalled();
  });

  it("should show validation error for invalid email", async () => {
    render(<ChangePasswordPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });

    const submitButton = screen.getByRole("button", {
      name: /change password/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Email is invalid.")).toBeInTheDocument();
    });
  });

  it("should show validation error for short new password", async () => {
    render(<ChangePasswordPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(currentPasswordInput, {
      target: { value: "password123" },
    });
    fireEvent.change(newPasswordInput, { target: { value: "12345" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "12345" } });

    const submitButton = screen.getByRole("button", {
      name: /change password/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("New password must be at least 6 characters.")
      ).toBeInTheDocument();
    });
  });

  it("should show validation error for mismatched passwords", async () => {
    render(<ChangePasswordPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(currentPasswordInput, {
      target: { value: "password123" },
    });
    fireEvent.change(newPasswordInput, { target: { value: "newpassword123" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "differentpassword" },
    });

    const submitButton = screen.getByRole("button", {
      name: /change password/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    });
  });

  it("should show validation error if new password is same as current", async () => {
    render(<ChangePasswordPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(currentPasswordInput, {
      target: { value: "password123" },
    });
    fireEvent.change(newPasswordInput, { target: { value: "password123" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "password123" },
    });

    const submitButton = screen.getByRole("button", {
      name: /change password/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          "New password must be different from current password."
        )
      ).toBeInTheDocument();
    });
  });

  it("should toggle password visibility", () => {
    render(<ChangePasswordPage />);

    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

    // Initially passwords should be hidden
    expect(currentPasswordInput).toHaveAttribute("type", "password");
    expect(newPasswordInput).toHaveAttribute("type", "password");
    expect(confirmPasswordInput).toHaveAttribute("type", "password");

    // Click show buttons
    const showButtons = screen.getAllByText("Show");
    fireEvent.click(showButtons[0]); // Current password
    fireEvent.click(showButtons[1]); // New password
    fireEvent.click(showButtons[2]); // Confirm password

    // Now passwords should be visible
    expect(currentPasswordInput).toHaveAttribute("type", "text");
    expect(newPasswordInput).toHaveAttribute("type", "text");
    expect(confirmPasswordInput).toHaveAttribute("type", "text");

    // Click hide buttons
    const hideButtons = screen.getAllByText("Hide");
    fireEvent.click(hideButtons[0]);
    fireEvent.click(hideButtons[1]);
    fireEvent.click(hideButtons[2]);

    // Back to hidden
    expect(currentPasswordInput).toHaveAttribute("type", "password");
    expect(newPasswordInput).toHaveAttribute("type", "password");
    expect(confirmPasswordInput).toHaveAttribute("type", "password");
  });

  it("should submit form successfully", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: "Password updated successfully!",
        success: true,
      }),
    });

    render(<ChangePasswordPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(currentPasswordInput, {
      target: { value: "password123" },
    });
    fireEvent.change(newPasswordInput, { target: { value: "newpassword123" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "newpassword123" },
    });

    const submitButton = screen.getByRole("button", {
      name: /change password/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "test@example.com",
          currentPassword: "password123",
          newPassword: "newpassword123",
          confirmPassword: "newpassword123",
        }),
      });
    });

    expect(mockToast.loading).toHaveBeenCalledWith("Changing password...");
    expect(mockToast.success).toHaveBeenCalledWith(
      "Password changed successfully!",
      { id: "toast-id" }
    );
  });

  it("should handle API errors", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Current password is incorrect." }),
    });

    render(<ChangePasswordPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(currentPasswordInput, {
      target: { value: "wrongpassword" },
    });
    fireEvent.change(newPasswordInput, { target: { value: "newpassword123" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "newpassword123" },
    });

    const submitButton = screen.getByRole("button", {
      name: /change password/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        "Current password is incorrect.",
        { id: "toast-id" }
      );
    });
  });

  it("should handle network errors", async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    render(<ChangePasswordPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(currentPasswordInput, {
      target: { value: "password123" },
    });
    fireEvent.change(newPasswordInput, { target: { value: "newpassword123" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "newpassword123" },
    });

    const submitButton = screen.getByRole("button", {
      name: /change password/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        "Network error. Please try again.",
        { id: "toast-id" }
      );
    });
  });

  it("should disable submit button while loading", async () => {
    (fetch as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    render(<ChangePasswordPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(currentPasswordInput, {
      target: { value: "password123" },
    });
    fireEvent.change(newPasswordInput, { target: { value: "newpassword123" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "newpassword123" },
    });

    const submitButton = screen.getByRole("button", {
      name: /change password/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /changing.../i })
      ).toBeDisabled();
    });
  });

  it("should clear form after successful submission", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: "Password updated successfully!",
        success: true,
      }),
    });

    render(<ChangePasswordPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(currentPasswordInput, {
      target: { value: "password123" },
    });
    fireEvent.change(newPasswordInput, { target: { value: "newpassword123" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "newpassword123" },
    });

    const submitButton = screen.getByRole("button", {
      name: /change password/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(emailInput).toHaveValue("");
      expect(currentPasswordInput).toHaveValue("");
      expect(newPasswordInput).toHaveValue("");
      expect(confirmPasswordInput).toHaveValue("");
    });
  });

  it("should render back to login link", () => {
    render(<ChangePasswordPage />);
    const loginLink = screen.getByText("back to login");
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.closest("a")).toHaveAttribute("href", "/login");
  });

  it("should handle input changes correctly", () => {
    render(<ChangePasswordPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

    fireEvent.change(emailInput, { target: { value: "user@test.com" } });
    fireEvent.change(currentPasswordInput, { target: { value: "oldpass123" } });
    fireEvent.change(newPasswordInput, { target: { value: "newpass123" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "newpass123" } });

    expect(emailInput).toHaveValue("user@test.com");
    expect(currentPasswordInput).toHaveValue("oldpass123");
    expect(newPasswordInput).toHaveValue("newpass123");
    expect(confirmPasswordInput).toHaveValue("newpass123");
  });

  it("should validate email format", async () => {
    render(<ChangePasswordPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.change(currentPasswordInput, {
      target: { value: "password123" },
    });
    fireEvent.change(newPasswordInput, { target: { value: "newpassword123" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "newpassword123" },
    });

    const submitButton = screen.getByRole("button", {
      name: /change password/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Email is invalid.")).toBeInTheDocument();
    });
  });

  it("should validate new password length", async () => {
    render(<ChangePasswordPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(currentPasswordInput, {
      target: { value: "password123" },
    });
    fireEvent.change(newPasswordInput, { target: { value: "123" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "123" } });

    const submitButton = screen.getByRole("button", {
      name: /change password/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("New password must be at least 6 characters.")
      ).toBeInTheDocument();
    });
  });

  it("should validate password confirmation", async () => {
    render(<ChangePasswordPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(currentPasswordInput, {
      target: { value: "password123" },
    });
    fireEvent.change(newPasswordInput, { target: { value: "newpassword123" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "different123" },
    });

    const submitButton = screen.getByRole("button", {
      name: /change password/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    });
  });

  it("should validate that new password is different from current", async () => {
    render(<ChangePasswordPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(currentPasswordInput, {
      target: { value: "samepassword123" },
    });
    fireEvent.change(newPasswordInput, {
      target: { value: "samepassword123" },
    });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "samepassword123" },
    });

    const submitButton = screen.getByRole("button", {
      name: /change password/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          "New password must be different from current password."
        )
      ).toBeInTheDocument();
    });
  });

  it("should show confirm password error when empty", async () => {
    render(<ChangePasswordPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(currentPasswordInput, {
      target: { value: "password123" },
    });
    fireEvent.change(newPasswordInput, { target: { value: "newpassword123" } });
    // confirmPassword left empty

    const submitButton = screen.getByRole("button", {
      name: /change password/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Please confirm your new password.")
      ).toBeInTheDocument();
    });
  });

  it("should toggle all password fields visibility independently", () => {
    render(<ChangePasswordPage />);

    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

    // All should initially be hidden
    expect(currentPasswordInput).toHaveAttribute("type", "password");
    expect(newPasswordInput).toHaveAttribute("type", "password");
    expect(confirmPasswordInput).toHaveAttribute("type", "password");

    // Get all show buttons
    const showButtons = screen.getAllByText("Show");
    expect(showButtons).toHaveLength(3);

    // Toggle current password
    fireEvent.click(showButtons[0]);
    expect(currentPasswordInput).toHaveAttribute("type", "text");
    expect(newPasswordInput).toHaveAttribute("type", "password");
    expect(confirmPasswordInput).toHaveAttribute("type", "password");

    // Toggle new password
    fireEvent.click(showButtons[1]);
    expect(currentPasswordInput).toHaveAttribute("type", "text");
    expect(newPasswordInput).toHaveAttribute("type", "text");
    expect(confirmPasswordInput).toHaveAttribute("type", "password");

    // Toggle confirm password
    fireEvent.click(showButtons[2]);
    expect(currentPasswordInput).toHaveAttribute("type", "text");
    expect(newPasswordInput).toHaveAttribute("type", "text");
    expect(confirmPasswordInput).toHaveAttribute("type", "text");

    // Now all should show "Hide" buttons
    const hideButtons = screen.getAllByText("Hide");
    expect(hideButtons).toHaveLength(3);

    // Hide all
    hideButtons.forEach((button) => fireEvent.click(button));
    expect(currentPasswordInput).toHaveAttribute("type", "password");
    expect(newPasswordInput).toHaveAttribute("type", "password");
    expect(confirmPasswordInput).toHaveAttribute("type", "password");
  });

  it("should handle successful API response without message", async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }), // No message field
    } as Response);

    render(<ChangePasswordPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(currentPasswordInput, {
      target: { value: "password123" },
    });
    fireEvent.change(newPasswordInput, { target: { value: "newpassword123" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "newpassword123" },
    });

    const submitButton = screen.getByRole("button", {
      name: /change password/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "test@example.com",
          currentPassword: "password123",
          newPassword: "newpassword123",
          confirmPassword: "newpassword123",
        }),
      });
    });

    expect(mockToast.success).toHaveBeenCalled();
  });

  it("should handle error response without message", async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}), // No message field
    } as Response);

    render(<ChangePasswordPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(currentPasswordInput, {
      target: { value: "wrongpassword" },
    });
    fireEvent.change(newPasswordInput, { target: { value: "newpassword123" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "newpassword123" },
    });

    const submitButton = screen.getByRole("button", {
      name: /change password/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("An error occurred.", {
        id: "toast-id",
      });
    });
  });

  it("should clear validation errors when form becomes valid", async () => {
    render(<ChangePasswordPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole("button", {
      name: /change password/i,
    });

    // First submit empty form to trigger validation errors
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Email is required.")).toBeInTheDocument();
      expect(
        screen.getByText("Current password is required.")
      ).toBeInTheDocument();
    });

    // Then fill form with valid data
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(currentPasswordInput, {
      target: { value: "password123" },
    });
    fireEvent.change(newPasswordInput, { target: { value: "newpassword123" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "newpassword123" },
    });

    // Mock successful response
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: "Password updated successfully!",
        success: true,
      }),
    } as Response);

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText("Email is required.")).not.toBeInTheDocument();
      expect(
        screen.queryByText("Current password is required.")
      ).not.toBeInTheDocument();
    });
  });

  it("should validate with minimum length password", async () => {
    render(<ChangePasswordPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(currentPasswordInput, {
      target: { value: "password123" },
    });
    fireEvent.change(newPasswordInput, { target: { value: "123456" } }); // exactly 6 chars
    fireEvent.change(confirmPasswordInput, { target: { value: "123456" } });

    // Mock successful response
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: "Password updated successfully!",
        success: true,
      }),
    } as Response);

    const submitButton = screen.getByRole("button", {
      name: /change password/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    expect(
      screen.queryByText("New password must be at least 6 characters.")
    ).not.toBeInTheDocument();
  });

  it("should validate valid email format", async () => {
    render(<ChangePasswordPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

    fireEvent.change(emailInput, {
      target: { value: "valid.email@domain.com" },
    });
    fireEvent.change(currentPasswordInput, {
      target: { value: "password123" },
    });
    fireEvent.change(newPasswordInput, { target: { value: "newpassword123" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "newpassword123" },
    });

    // Mock successful response
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: "Password updated successfully!",
        success: true,
      }),
    } as Response);

    const submitButton = screen.getByRole("button", {
      name: /change password/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    expect(screen.queryByText("Email is invalid.")).not.toBeInTheDocument();
  });
});
