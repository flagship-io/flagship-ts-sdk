import { Request, Response } from '../deps'

export const getLog = (req: Request, res: Response):void => {
  const logs = req.session.logs
  console.log('getLog', req.session)
  console.log('id', req.session.id)

  res.send(logs)
}

export const clearLog = (req: Request, res: Response):void => {
  req.session.logs = ''
  res.json(null)
}