/**
 * Simple Dependency Injection Container
 * For enterprise apps, consider using tsyringe or InversifyJS.
 */

import { IAuthInteractor } from "../../application/ports/IAuthInteractor";
import { IUserRepository } from "../../application/ports/IUserRepository";
import { IRefreshTokenRepository } from "../../application/ports/IRefreshTokenRepository";
import { IJwtService } from "../../application/ports/IJwtService";
import { IOAuthProviderService } from "../../application/ports/IOAuthProviderService";
import { IConfigurationService } from "../../application/ports/IConfigurationService";
import { IDatabaseClient } from "../database/IDatabaseClient";

import { AuthInteractor } from "../../application/use-cases/AuthInteractor";
import { UserRepository } from "../repositories/UserRepository";
import { RefreshTokenRepository } from "../repositories/RefreshTokenRepository";
import { JwtService } from "../services/JwtService";
import { GoogleAuthService } from "../services/google/GoogleAuthService";
import { ConfigurationService } from "../config/ConfigurationService";
import { PostgresDatabaseClient } from "../database/PostgresDatabaseClient";

export class Container {
  private static instance: Container;
  private services: Map<string, any> = new Map();

  private constructor() {
    this.initializeServices();
  }

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  private initializeServices(): void {
    // Infrastructure
    const dbClient: IDatabaseClient = new PostgresDatabaseClient();
    this.services.set("IDatabaseClient", dbClient);

    const configService: IConfigurationService = new ConfigurationService();
    this.services.set("IConfigurationService", configService);

    // Repositories
    const userRepository: IUserRepository = new UserRepository(dbClient);
    this.services.set("IUserRepository", userRepository);

    const refreshTokenRepository: IRefreshTokenRepository =
      new RefreshTokenRepository(dbClient);
    this.services.set("IRefreshTokenRepository", refreshTokenRepository);

    // Services
    const jwtService: IJwtService = new JwtService(configService);
    this.services.set("IJwtService", jwtService);

    const oAuthService: IOAuthProviderService = new GoogleAuthService(
      configService
    );
    this.services.set("IOAuthProviderService", oAuthService);

    // Use Cases
    const authInteractor: IAuthInteractor = new AuthInteractor(
      userRepository,
      refreshTokenRepository,
      jwtService,
      oAuthService,
      configService
    );
    this.services.set("IAuthInteractor", authInteractor);
  }

  get<T>(key: string): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service ${key} not found in container`);
    }
    return service as T;
  }
}

export const container = Container.getInstance();
