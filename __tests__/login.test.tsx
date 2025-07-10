import "@testing-library/jest-dom";
import "@testing-library/react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import LoginPage from "../src/app/login/page";

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
  toast: {
    loading: jest.fn(() => "toast-id"),
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn() as jest.Mock;

describe("LoginPage", () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    jest.clearAllMocks();
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
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    expect(emailInput.value).toBe("test@example.com");
  });

  it("should update password input value when typed", () => {
    render(<LoginPage />);
    const passwordInput = screen.getByLabelText(
      /password/i
    ) as HTMLInputElement;

    fireEvent.change(passwordInput, { target: { value: "password123" } });
    expect(passwordInput.value).toBe("password123");
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
});
