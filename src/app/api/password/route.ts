import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, currentPassword, newPassword, confirmPassword } =
      await request.json();

    // Validation
    if (!email || !currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { message: "All fields are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: "New password must be at least 6 characters." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { message: "New password and confirm password do not match." },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { message: "New password must be different from current password." },
        { status: 400 }
      );
    }

    // Mock authentication - verify current password
    if (email === "test@example.com" && currentPassword === "password123") {
      // In a real app, you would hash the new password and update the database
      return NextResponse.json({
        message: "Password updated successfully!",
        success: true,
      });
    }

    return NextResponse.json(
      { message: "Current password is incorrect." },
      { status: 401 }
    );
  } catch (error) {
    console.error("Password change error:", error);
    return NextResponse.json(
      { message: "Invalid request format." },
      { status: 400 }
    );
  }
}
