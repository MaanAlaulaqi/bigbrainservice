import { JsonController, Post, Req, Res, UseBefore, Body } from "routing-controllers";
import { Service } from "typedi";
import type { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { RequireProxyMiddleware } from "../middlewares/RequireProxyMiddleware";
import { AuthContextMiddleware } from "../middlewares/AuthContextMiddleware";
import { DocUploadMetaSchema } from "../schemas/docs.schemas";
import { DocIngestionService } from "../services/DocIngestionService";
import { env } from "../env";

const uploadDir = env.dirs.uploadDir;
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: Number(env.MAX_UPLOAD_MB) * 1024 * 1024 },
});

@Service()
@JsonController("/docs")
@UseBefore(RequireProxyMiddleware, AuthContextMiddleware)
export class DocsController {
  constructor(private ingestion: DocIngestionService) {}

  @Post("/upload")
  async uploadDoc(@Req() req: Request, @Res() res: Response, @Body() body: any) {
    // Multer is not a routing-controllers middleware by default,
    // so we manually run it here to keep controllers thin-ish.
    await new Promise<void>((resolve, reject) => {
      upload.single("file")(req as any, res as any, (err: any) => (err ? reject(err) : resolve()));
    });

    const auth = req.auth!;
    const meta = DocUploadMetaSchema.parse(body);

    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) return res.status(400).json({ error: "Missing file field 'file'" });

    const docId = await this.ingestion.registerUpload(auth, {
      filename: file.originalname,
      mimeType: file.mimetype,
      kind: meta.kind,
      source: meta.source,
    });

    // process immediately (KISS). Later you can queue this.
    const result = await this.ingestion.processFile(auth, docId, file.path, file.mimetype);

    return res.json({ docId, ...result });
  }
}
