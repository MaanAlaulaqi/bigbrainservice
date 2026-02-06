import { ExpressMiddlewareInterface, Middleware } from "routing-controllers";
import {Service} from "typedi";

@Service()
@Middleware({ type: "before" })
export class AuthContextMiddleware implements ExpressMiddlewareInterface {
  use(req: any, res: any, next: (err?: any) => any) {
    const orgId = req.header("x-org-id");
    const employeeId = req.header("x-employee-id");
    const rolesRaw = req.header("x-roles") ?? "";

    if (!orgId || !employeeId) return res.status(401).json({ error: "Missing auth context headers" });

    req.auth = {
      orgId,
      employeeId,
      roles: rolesRaw.split(",").map((r: string) => r.trim()).filter(Boolean),
    };

    next();
  }
}
