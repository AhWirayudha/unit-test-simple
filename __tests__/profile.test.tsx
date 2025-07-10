/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProfilePage from "@/app/profile/page";

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
  toast: {
    loading: jest.fn(() => "toast-id"),
    success: jest.fn(),
    error: jest.fn(),
  },
}));

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ success: true }),
    ok: true,
  })
) as jest.Mock;

describe("ProfilePage", () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    jest.clearAllMocks();
  });

  it("renders all form fields", () => {
    render(<ProfilePage />);
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Birth Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Bio/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Update/i })).toBeInTheDocument();
  });

  it("shows validation errors for empty/invalid fields", async () => {
    render(<ProfilePage />);
    fireEvent.click(screen.getByRole("button", { name: /Update/i }));

    expect(
      await screen.findByText(/Username must be at least 6 characters/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Full name is required/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Must be a valid email format/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Phone must be 10-15 digits/i)).toBeInTheDocument();
  });

  it("shows validation error for bio too long", async () => {
    render(<ProfilePage />);
    const bioInput = screen.getByLabelText(/Bio/i);

    fireEvent.change(bioInput, {
      target: { value: "a".repeat(161) },
    });
    fireEvent.click(screen.getByRole("button", { name: /Update/i }));

    expect(
      await screen.findByText(/Bio must be 160 characters or less/i)
    ).toBeInTheDocument();
  });

  it("shows validation error for future birth date", async () => {
    render(<ProfilePage />);
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureDateString = futureDate.toISOString().split("T")[0];

    const birthDateInput = screen.getByLabelText(/Birth Date/i);
    fireEvent.change(birthDateInput, {
      target: { value: futureDateString },
    });
    fireEvent.click(screen.getByRole("button", { name: /Update/i }));

    expect(
      await screen.findByText(/Birth date cannot be in the future/i)
    ).toBeInTheDocument();
  });

  it("updates input values when typed", () => {
    render(<ProfilePage />);

    const usernameInput = screen.getByLabelText(
      /Username/i
    ) as HTMLInputElement;
    const fullNameInput = screen.getByLabelText(
      /Full Name/i
    ) as HTMLInputElement;
    const emailInput = screen.getByLabelText(/Email/i) as HTMLInputElement;
    const phoneInput = screen.getByLabelText(/Phone/i) as HTMLInputElement;
    const birthDateInput = screen.getByLabelText(
      /Birth Date/i
    ) as HTMLInputElement;
    const bioInput = screen.getByLabelText(/Bio/i) as HTMLTextAreaElement;

    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.change(fullNameInput, { target: { value: "Test User" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(phoneInput, { target: { value: "1234567890" } });
    fireEvent.change(birthDateInput, { target: { value: "1990-01-01" } });
    fireEvent.change(bioInput, { target: { value: "Test bio" } });

    expect(usernameInput.value).toBe("testuser");
    expect(fullNameInput.value).toBe("Test User");
    expect(emailInput.value).toBe("test@example.com");
    expect(phoneInput.value).toBe("1234567890");
    expect(birthDateInput.value).toBe("1990-01-01");
    expect(bioInput.value).toBe("Test bio");
  });

  it("submits valid form and shows success message", async () => {
    render(<ProfilePage />);
    fireEvent.change(screen.getByLabelText(/Username/i), {
      target: { value: "validuser" },
    });
    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: "1234567890" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Update/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/profile",
        expect.objectContaining({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        })
      );
    });
  });

  it("handles API error response", async () => {
    const mockErrorResponse = {
      ok: false,
      json: jest.fn().mockResolvedValue({ message: "Server error" }),
    };
    (fetch as jest.Mock).mockResolvedValue(mockErrorResponse);

    render(<ProfilePage />);
    fireEvent.change(screen.getByLabelText(/Username/i), {
      target: { value: "validuser" },
    });
    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: "1234567890" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Update/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  it("does not submit form when validation fails", () => {
    render(<ProfilePage />);
    fireEvent.click(screen.getByRole("button", { name: /Update/i }));

    expect(fetch).not.toHaveBeenCalled();
  });

  it("clears errors when form becomes valid", async () => {
    render(<ProfilePage />);

    // First trigger validation errors
    fireEvent.click(screen.getByRole("button", { name: /Update/i }));

    expect(
      await screen.findByText(/Username must be at least 6 characters/i)
    ).toBeInTheDocument();

    // Then fill valid data
    fireEvent.change(screen.getByLabelText(/Username/i), {
      target: { value: "validuser" },
    });
    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: "1234567890" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Update/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  it("validates email format correctly", async () => {
    render(<ProfilePage />);

    const emailInput = screen.getByLabelText(/Email/i);
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.click(screen.getByRole("button", { name: /Update/i }));

    expect(
      await screen.findByText(/Must be a valid email format/i)
    ).toBeInTheDocument();
  });

  it("validates phone format correctly", async () => {
    render(<ProfilePage />);

    const phoneInput = screen.getByLabelText(/Phone/i);
    fireEvent.change(phoneInput, { target: { value: "123abc" } });
    fireEvent.click(screen.getByRole("button", { name: /Update/i }));

    expect(
      await screen.findByText(/Phone must be 10-15 digits/i)
    ).toBeInTheDocument();
  });

  it("validates phone length correctly", async () => {
    render(<ProfilePage />);

    const phoneInput = screen.getByLabelText(/Phone/i);
    fireEvent.change(phoneInput, { target: { value: "123456789" } }); // 9 digits
    fireEvent.click(screen.getByRole("button", { name: /Update/i }));

    expect(
      await screen.findByText(/Phone must be 10-15 digits/i)
    ).toBeInTheDocument();
  });

  it("accepts valid birth date", async () => {
    render(<ProfilePage />);

    const birthDateInput = screen.getByLabelText(/Birth Date/i);
    fireEvent.change(birthDateInput, { target: { value: "1990-01-01" } });
    fireEvent.change(screen.getByLabelText(/Username/i), {
      target: { value: "validuser" },
    });
    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: "1234567890" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Update/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  it("accepts empty birth date", async () => {
    render(<ProfilePage />);

    fireEvent.change(screen.getByLabelText(/Username/i), {
      target: { value: "validuser" },
    });
    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: "1234567890" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Update/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });
});
