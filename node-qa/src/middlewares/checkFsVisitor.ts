import { sessionVisitors } from '../controllers/visitor'
import { Request, Response, NextFunction } from '../deps'

export const checkFsVisitor = (req: Request, res: Response, next: NextFunction): void => {
  if (!sessionVisitors[req.session.id]) {
    res.status(422).json({ error: 'Set your Visitor ID and context', ok: true })
    return
  }
  next()
}
