import { User } from "../../domain/entities/User";
import { OAuthProvider } from "../dto/OAuthProfile";

export interface CreateUserParams {
  email: string;
  name?: string | null;
  picture?: string | null;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByOAuthAccount(
    provider: OAuthProvider,
    providerUserId: string
  ): Promise<User | null>;
  create(params: CreateUserParams): Promise<User>;
  linkOAuthAccount(
    userId: string,
    provider: OAuthProvider,
    providerUserId: string
  ): Promise<User>;
}

