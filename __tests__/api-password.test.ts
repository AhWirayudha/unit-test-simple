/**
 * @jest-environment node
 */
import { POST } from "@/app/api/password/route";
import { NextRequest } from "next/server";

describe("POST /api/password", () => {
  it("should return 400 if email is missing", async () => {
    const request = new NextRequest("http://localhost/api/password", {
      method: "POST",
      body: JSON.stringify({
        currentPassword: "password123",
        newPassword: "newpassword123",
        confirmPassword: "newpassword123",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe("All fields are required.");
  });

  it("should return 400 if currentPassword is missing", async () => {
    const request = new NextRequest("http://localhost/api/password", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        newPassword: "newpassword123",
        confirmPassword: "newpassword123",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe("All fields are required.");
  });

  it("should return 400 if newPassword is missing", async () => {
    const request = new NextRequest("http://localhost/api/password", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        currentPassword: "password123",
        confirmPassword: "newpassword123",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe("All fields are required.");
  });

  it("should return 400 if confirmPassword is missing", async () => {
    const request = new NextRequest("http://localhost/api/password", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        currentPassword: "password123",
        newPassword: "newpassword123",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe("All fields are required.");
  });

  it("should return 400 if all fields are missing", async () => {
    const request = new NextRequest("http://localhost/api/password", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe("All fields are required.");
  });

  it("should return 400 if new password is too short", async () => {
    const request = new NextRequest("http://localhost/api/password", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        currentPassword: "password123",
        newPassword: "12345",
        confirmPassword: "12345",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe("New password must be at least 6 characters.");
  });

  it("should return 400 if passwords do not match", async () => {
    const request = new NextRequest("http://localhost/api/password", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        currentPassword: "password123",
        newPassword: "newpassword123",
        confirmPassword: "differentpassword123",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe(
      "New password and confirm password do not match."
    );
  });

  it("should return 400 if new password is same as current password", async () => {
    const request = new NextRequest("http://localhost/api/password", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        currentPassword: "password123",
        newPassword: "password123",
        confirmPassword: "password123",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe(
      "New password must be different from current password."
    );
  });

  it("should return 401 if current password is incorrect", async () => {
    const request = new NextRequest("http://localhost/api/password", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        currentPassword: "wrongpassword",
        newPassword: "newpassword123",
        confirmPassword: "newpassword123",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.message).toBe("Current password is incorrect.");
  });

  it("should return 401 if email is not found", async () => {
    const request = new NextRequest("http://localhost/api/password", {
      method: "POST",
      body: JSON.stringify({
        email: "nonexistent@example.com",
        currentPassword: "password123",
        newPassword: "newpassword123",
        confirmPassword: "newpassword123",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.message).toBe("Current password is incorrect.");
  });

  it("should return 200 if password change is successful", async () => {
    const request = new NextRequest("http://localhost/api/password", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        currentPassword: "password123",
        newPassword: "newpassword123",
        confirmPassword: "newpassword123",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toBe("Password updated successfully!");
    expect(data.success).toBe(true);
  });

  it("should return 400 if request body is invalid JSON", async () => {
    // Suppress console.error for this test since we're intentionally causing an error
    const originalConsoleError = console.error;
    console.error = jest.fn();

    const request = new NextRequest("http://localhost/api/password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: "invalid json",
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe("Invalid request format.");

    // Restore console.error
    console.error = originalConsoleError;
  });
});
