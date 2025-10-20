import { Request, Response, NextFunction } from 'express';

function asyncWrapper(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default asyncWrapper;
