import { NextFunction, Request, Response } from "express";
import { IAuthInteractor } from "../../application/ports/IAuthInteractor";
import { IConfigurationService } from "../../application/ports/IConfigurationService";
import { ms } from "../../shared/utils/time.util";
import { createCookieOptions } from "../../shared/utils/cookies";

export class AuthController {
  constructor(
    private readonly authInteractor: IAuthInteractor,
    private readonly configService: IConfigurationService
  ) {}

  private getAccessToken(req: Request): string | undefined {
    return req.cookies?.["access_token"];
  }

  private getCookieBase() {
    return createCookieOptions(
      this.configService.getCookieSecure(),
      this.configService.getCookieDomain()
    );
  }

  async authenticateWithOAuth(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const token = req.body.token;

      const result = await this.authInteractor.authenticateWithOAuth(
        token,
        req.get("user-agent") || undefined,
        req.ip
      );

      const cookieBase = this.getCookieBase();

      res.cookie("access_token", result.accessToken, {
        ...cookieBase,
        path: "/",
        maxAge: ms(this.configService.getJwtAccessTtl()),
      });

      res.cookie("refresh_token", result.refreshToken, {
        ...cookieBase,
        path: "/auth/refresh",
        maxAge: result.refreshExpiresAt.getTime() - Date.now(),
      });

      res.json({ user: result.user });
    } catch (err) {
      next(err);
    }
  }

  async rotateRefreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const cookie = req.cookies.refresh_token;

      const result = await this.authInteractor.rotateRefreshToken(
        cookie,
        req.get("user-agent") || undefined,
        req.ip
      );

      const cookieBase = this.getCookieBase();

      res.cookie("access_token", result.accessToken, {
        ...cookieBase,
        path: "/",
        maxAge: ms(this.configService.getJwtAccessTtl()),
      });

      res.cookie("refresh_token", result.refreshToken, {
        ...cookieBase,
        path: "/auth/refresh",
        maxAge: result.refreshExpiresAt.getTime() - Date.now(),
      });

      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }

  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const access = this.getAccessToken(req);
      const result = await this.authInteractor.getCurrentUser(access || "");
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async signOut(req: Request, res: Response, next: NextFunction) {
    try {
      const access = this.getAccessToken(req);
      await this.authInteractor.signOut(access || "");

      const cookieBase = this.getCookieBase();
      res.clearCookie("access_token", { ...cookieBase, path: "/" });
      res.clearCookie("refresh_token", {
        ...cookieBase,
        path: "/auth/refresh",
      });

      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
}

