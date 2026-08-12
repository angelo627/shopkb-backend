import { Router } from "express";

import { authRouter } from "../modules/auth/auth.routes";
import { authenticate, authorize } from "../middlewares/auth.middleware"
import { productRouter, adminProductRouter } from "../modules/products/product.routes";
import {
  businessDayRouter,
  adminBusinessDayRouter,
} from "../modules/businessDay/business-day.routes";
import { adminActivityLogRouter } from "../modules/activity-logs/activity-log.routes";
import { stockMovementRouter } from "../modules/stockMovement/stock-movement.routes";
import { saleRouter, adminsaleRouter } from "../modules/sales/sale.routes";


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
Apirouter.use("/user", productRouter);
Apirouter.use("/user", businessDayRouter);
Apirouter.use("/user", stockMovementRouter);
Apirouter.use("/user", saleRouter);






//this section will be for SuperAdmin routes
// adminrouter.use("/admin", authorize( "SUPERADMIN"), productRouter); //will refernce from this for future apis






//Admin & SuperAdmin, all adminroutes access based 
adminrouter.use(authorize("ADMIN", "SUPERADMIN"));
adminrouter.use("/admin", adminProductRouter);
adminrouter.use("/admin", adminBusinessDayRouter);
adminrouter.use("/admin", adminActivityLogRouter);
adminrouter.use("/admin", adminsaleRouter);






// adminrouter linked to apirouter "/admin" for the route below incase 
Apirouter.use("/", adminrouter)

export default Apirouter;