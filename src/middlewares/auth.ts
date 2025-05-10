import { Request, Response, NextFunction } from "express";

export const auth = (req: Request, res: Response, next: NextFunction): any => {
  const url = decodeURIComponent(req.url);
  const urlObject = new URL(url, `${req.protocol}://${req.headers.host}`);
  const searchParams = Object.fromEntries(urlObject.searchParams.entries());
  const token = req.query['token'] ?? req.headers['token'] ?? searchParams['token'] ?? '';
  const chatGptApiKey = req.query['chatGptApiKey'] ?? req.headers['chatGptApiKey'] ?? searchParams['chatGptApiKey'] ?? '';

  (req as any).auth = {
    token,
    chatGptApiKey
  };

  /*if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }*/
  next();
}