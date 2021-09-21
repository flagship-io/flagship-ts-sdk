import { Request, Response, NextFunction } from '../deps'

export const checkFlagshipStart = (req: Request, res: Response, next: NextFunction):void => {
  if (!req.session.config) {
    res.status(422).json({ error: 'First, set your Flagship Environment ID & API Key', ok: true })
    return
  }
  next()
}
