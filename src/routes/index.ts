import { Router } from "express";

import { authRouter } from "../modules/auth/auth.routes";
import { authenticate, authorize } from "../middlewares/auth.middleware"
import { productRouter } from "../modules/products/product.routes";

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



// Everything below requires authentication, protected routes for users etc
Apirouter.use(authenticate);







//this section will be for SuperAdmin routes
adminrouter.use("/admin", authorize( "SUPERADMIN"), productRouter);






//Admin & SuperAdmin, all adminroutes access based 
adminrouter.use(authorize("ADMIN", "SUPERADMIN"));






// adminrouter linked to apirouter "/admin" for the route below incase 
Apirouter.use("/", adminrouter)

export default Apirouter;