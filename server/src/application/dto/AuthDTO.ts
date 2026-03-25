import { UserDTO } from "./UserDTO";

export interface SignInResultDTO {
  user: UserDTO;
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

export interface RotateTokenResultDTO {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

export interface GetCurrentUserResultDTO {
  user: UserDTO | null;
}

