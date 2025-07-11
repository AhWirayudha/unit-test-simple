import "@testing-library/jest-dom";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import LoginPage from "../src/app/login/page";

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

describe("LoginPage", () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    jest.clearAllMocks();
    // Clear the mock toast functions
    mockToast.loading.mockClear();
    mockToast.success.mockClear();
    mockToast.error.mockClear();
  });

  it("should render the login form", () => {
    render(<LoginPage />);
    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("should show an error if email is missing", () => {
    render(<LoginPage />);
    const submitButton = screen.getByRole("button", { name: /login/i });
    fireEvent.click(submitButton);
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });

  it("should show an error if password is too short", () => {
    render(<LoginPage />);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /login/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "12345" } });
    fireEvent.click(submitButton);

    expect(
      screen.getByText(/password must be at least 6 characters/i)
    ).toBeInTheDocument();
  });

  it("should show password when toggle button is clicked", () => {
    render(<LoginPage />);
    const passwordInput = screen.getByLabelText(/password/i);
    const toggleButton = screen.getByLabelText(/show password/i);

    expect(passwordInput).toHaveAttribute("type", "password");

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "text");

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("should update email input value when typed", () => {
    render(<LoginPage />);
    const emailInput = screen.getByLabelText(/email/i);

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    expect(emailInput).toHaveValue("test@example.com");
  });

  it("should update password input value when typed", () => {
    render(<LoginPage />);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(passwordInput, { target: { value: "password123" } });
    expect(passwordInput).toHaveValue("password123");
  });

  it("should call API and show success message on successful login", async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ message: "Login successful!" }),
    };
    (fetch as jest.Mock).mockResolvedValue(mockResponse);

    render(<LoginPage />);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /login/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
        }),
      });
    });
  });

  it("should show error message on failed login", async () => {
    const mockResponse = {
      ok: false,
      json: jest.fn().mockResolvedValue({ message: "Invalid credentials" }),
    };
    (fetch as jest.Mock).mockResolvedValue(mockResponse);

    render(<LoginPage />);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /login/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  it("should not submit form when validation fails", () => {
    render(<LoginPage />);
    const submitButton = screen.getByRole("button", { name: /login/i });

    fireEvent.click(submitButton);

    expect(fetch).not.toHaveBeenCalled();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });

  it("should clear errors when form is valid", () => {
    render(<LoginPage />);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /login/i });

    // First trigger validation errors
    fireEvent.click(submitButton);
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();

    // Then fill valid data
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    // Mock successful response
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ message: "Login successful!" }),
    };
    (fetch as jest.Mock).mockResolvedValue(mockResponse);

    fireEvent.click(submitButton);

    // Errors should be cleared
    expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
  });

  it("should render change password link", () => {
    render(<LoginPage />);
    const changePasswordLink = screen.getByText(
      "Forgot your password? Change it here"
    );
    expect(changePasswordLink).toBeInTheDocument();
    expect(changePasswordLink.closest("a")).toHaveAttribute(
      "href",
      "/change-password"
    );
  });

  it("should handle form submission with empty email and password", async () => {
    render(<LoginPage />);
    const submitButton = screen.getByRole("button", { name: /login/i });

    fireEvent.click(submitButton);

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should handle API error with default message", async () => {
    const mockResponse = {
      ok: false,
      json: jest.fn().mockResolvedValue({}), // No message property
    };
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
      mockResponse as unknown as Response
    );

    render(<LoginPage />);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /login/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("An error occurred.", {
        id: "toast-id",
      });
    });
  });

  it("should handle network error gracefully", async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(
      new Error("Network error")
    );

    render(<LoginPage />);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /login/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  it("should show loading toast during API call", async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ message: "Login successful!" }),
    };
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
      mockResponse as unknown as Response
    );

    render(<LoginPage />);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /login/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    expect(mockToast.loading).toHaveBeenCalledWith("Logging in...");
  });

  it("should clear previous errors when form becomes valid", async () => {
    render(<LoginPage />);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /login/i });

    // First, trigger validation errors
    fireEvent.click(submitButton);
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();

    // Then make form valid
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "validpassword" } });

    // Submit again with valid data
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ message: "Login successful!" }),
    };
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
      mockResponse as unknown as Response
    );

    fireEvent.click(submitButton);

    // Errors should be cleared
    await waitFor(() => {
      expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
    });
  });

  it("should validate password length correctly", () => {
    render(<LoginPage />);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /login/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "123" } });
    fireEvent.click(submitButton);

    expect(
      screen.getByText(/password must be at least 6 characters/i)
    ).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should accept valid 6-character password", async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ message: "Login successful!" }),
    };
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
      mockResponse as unknown as Response
    );

    render(<LoginPage />);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /login/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "123456" } }); // Exactly 6 characters
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
    expect(
      screen.queryByText(/password must be at least 6 characters/i)
    ).not.toBeInTheDocument();
  });

  it("should toggle password visibility with correct aria-label", () => {
    render(<LoginPage />);
    const passwordInput = screen.getByLabelText(/password/i);

    // Initially should show "Show password" button
    const showButton = screen.getByLabelText(/show password/i);
    expect(showButton).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute("type", "password");

    // Click to show password
    fireEvent.click(showButton);
    expect(passwordInput).toHaveAttribute("type", "text");

    // Now should show "Hide password" button
    const hideButton = screen.getByLabelText(/hide password/i);
    expect(hideButton).toBeInTheDocument();

    // Click to hide password again
    fireEvent.click(hideButton);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("should handle form reset state correctly", () => {
    render(<LoginPage />);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    // Initial state should be empty
    expect(emailInput).toHaveValue("");
    expect(passwordInput).toHaveValue("");

    // Change values
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("password123");
  });
});
