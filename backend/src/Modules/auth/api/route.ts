import { Router } from "express";
import { validate } from "../../../middlewares/auth.middleware";
import { createUser } from "../../users/controllers/user.controller";
import {
  login,
  logout,
  refreshAccessToken,
} from "../controllers/auth.controller";
import { userCreationSchema } from "../../users/validators/user.schema";
import { loginSchema } from "../validations/auth.schema";

const router = Router();

// ─── Public routes ─────────────────────────────────────────────────────────────

router.post("/register", validate(userCreationSchema), createUser);

router.post("/login", validate(loginSchema), login);

// refresh token is read from httpOnly cookie — no auth middleware needed
router.post("/refresh", refreshAccessToken);

// ─── Protected routes ──────────────────────────────────────────────────────────

// logout requires a valid access token so a random request can't spam it
// refresh token is still read from the httpOnly cookie inside the controller
router.post("/logout", logout);

export default router;
