import express from "express";
import { AuthController } from "../controllers/AuthController";
import { validateBody } from "../middlewares/validateRequest";
import { oauthAuthSchema } from "../schemas/auth.schema";
import { requireRefreshToken } from "../middlewares/requireRefreshToken";
import { container } from "../../infrastructure/di/container";
import { IAuthInteractor } from "../../application/ports/IAuthInteractor";
import { IConfigurationService } from "../../application/ports/IConfigurationService";

const router = express.Router();

const authInteractor =
  container.get<IAuthInteractor>("IAuthInteractor");
const configService =
  container.get<IConfigurationService>("IConfigurationService");
const controller = new AuthController(authInteractor, configService);

router.post(
  "/google",
  validateBody(oauthAuthSchema),
  controller.authenticateWithOAuth.bind(controller)
);
router.post(
  "/refresh",
  requireRefreshToken,
  controller.rotateRefreshToken.bind(controller)
);
router.get("/me", controller.getCurrentUser.bind(controller));
router.post("/logout", controller.signOut.bind(controller));

export default router;
