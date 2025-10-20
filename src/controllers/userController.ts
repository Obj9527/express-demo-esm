import { Request, Response } from 'express';
import { User } from '../models/User';

export async function getUserInfo(req: Request, res: Response) {
  try {
    const user = await User.findById(req.body.user?.id).select('-password'); // 不返回密码
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: '服务器错误' });
  }
}
