import { getAllUsers, createUser } from "../controllers/user.controller";
import { validate } from "../../../middlewares/auth.middleware";
import { userCreationSchema } from "../validators/user.schema";
import { Router } from "express";

const router = Router();

router.get("/users", getAllUsers);

export default router;
