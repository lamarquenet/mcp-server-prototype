import { Request, Response, NextFunction } from "express";

export const auth = (req: Request, res: Response, next: NextFunction): any => {
  const url = decodeURIComponent(req.url);
  const urlObject = new URL(url, `${req.protocol}://${req.headers.host}`);
  const searchParams = Object.fromEntries(urlObject.searchParams.entries());
  const token = req.query['token'] ?? req.headers['token'] ?? searchParams['token'] ?? '';

  (req as any).auth = {
    token
  };

  /*if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }*/
  next();
}