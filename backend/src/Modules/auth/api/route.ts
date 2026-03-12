import { createUser } from "../../users/controllers/user.controller";
import { validate } from "../../../middlewares/auth.middleware";
import { userCreationSchema } from "../../users/validators/user.schema";
import { Router } from "express";

const router = Router();

router.post("/register", validate(userCreationSchema), createUser);

export default router;
