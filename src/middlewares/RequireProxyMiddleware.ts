import { ExpressMiddlewareInterface, Middleware } from "routing-controllers";
import { env } from "../env";
import { Service } from "typedi";

@Service()
@Middleware({ type: "before" })
export class RequireProxyMiddleware implements ExpressMiddlewareInterface {
  use(req: any, res: any, next: (err?: any) => any) {
    const expected = env.PROXY_SHARED_SECRET;
    const provided = req.header("x-proxy-secret");

    if (!expected) return res.status(500).json({ error: "Missing PROXY_SHARED_SECRET" });
    if (provided !== expected) return res.status(403).json({ error: "Forbidden: proxy only" });

    next();
  }
}
