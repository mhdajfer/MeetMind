/**
 * Value Object: Email
 * Encapsulates email validation and formatting.
 */
export class Email {
  private readonly value: string;

  private constructor(email: string) {
    this.validate(email);
    this.value = email.toLowerCase().trim();
  }

  static create(email: string): Email {
    return new Email(email);
  }

  private validate(email: string): void {
    if (!email || email.trim().length === 0) {
      throw new Error("Email cannot be empty");
    }

    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegex.test(email)) {
      throw new Error(`Invalid email format: ${email}`);
    }

    if (email.length > 254) {
      throw new Error("Email address is too long");
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
