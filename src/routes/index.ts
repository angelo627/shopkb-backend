import { Router } from "express";

import { authRouter } from "../modules/auth/auth.routes";
import { authenticate, authorize } from "../middlewares/auth.middleware"

const Apirouter = Router();
const adminrouter = Router();

Apirouter.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy.",
  });
});



// all routes -public
Apirouter.use("/auth", authRouter); // for login and signup and others from auths



// protected routes for users etc
Apirouter.use(authenticate);



//all adminroutes 
adminrouter.use(authorize("ADMIN", "SUPERADMIN"));
// adminrouter.use("/")







// adminrouter linked to apirouter
Apirouter.use("/admin", adminrouter)

export default Apirouter;