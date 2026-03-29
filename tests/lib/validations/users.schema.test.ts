import { describe, expect, it } from "vitest";
import {
  CreateUserSchema,
  SignUpSchema,
  UpdateUserSchema,
} from "@/lib/validations/users.schema";

describe("CreateUserSchema", () => {
  it("accepts a valid name and email", () => {
    const result = CreateUserSchema.safeParse({
      email: "test@example.com",
      name: "Test User",
      image: "https://example.com/avatar.png",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = CreateUserSchema.safeParse({
      email: "test@example.com",
      name: "",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.name).toBeTruthy();
  });

  it("rejects an invalid email format", () => {
    const result = CreateUserSchema.safeParse({
      email: "not-an-email",
      name: "Test User",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.email).toBeTruthy();
  });

  it("rejects an empty email", () => {
    const result = CreateUserSchema.safeParse({
      email: "",
      name: "Test User",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.email).toBeTruthy();
  });

  it("allows image to be omitted or null", () => {
    expect(
      CreateUserSchema.safeParse({
        email: "test@example.com",
        name: "Test User",
      }).success,
    ).toBe(true);

    expect(
      CreateUserSchema.safeParse({
        email: "test@example.com",
        name: "Test User",
        image: null,
      }).success,
    ).toBe(true);
  });
});

describe("UpdateUserSchema", () => {
  it("accepts partial updates", () => {
    const result = UpdateUserSchema.safeParse({
      name: "Updated Name",
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ name: "Updated Name" });
  });
});

describe("SignUpSchema", () => {
  it("rejects mismatched passwords", () => {
    const result = SignUpSchema.safeParse({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      confirmPassword: "password456",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.confirmPassword).toBeTruthy();
  });
});
