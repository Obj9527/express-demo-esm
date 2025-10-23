import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';
import { BusinessError } from '../utils/error';
import { NextFunction, Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { User } from '../models/User';

async function registerUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { username, password } = req.body as {
    username: string;
    password: string;
  };
  const userService = new UserService();

  if (!username || !password) {
    throw new BusinessError('Username and password is required', 300310);
  }

  const exists = await userService.findByUsername(username);

  if (exists) {
    throw new BusinessError('User already exists', 300311);
  }

  const newUser = await userService.createUser(username, password);

  logger.info(`用户注册成功：userId=${newUser.id}`);

  res.status(201).json({ message: '注册成功' });
}

async function loginUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const user = await User.findOne({ username });

  if (!user) {
    return res.status(404).json({ error: '用户不存在或密码错误' });
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    return res.status(401).json({ error: '用户不存在或密码错误' });
  }

  const token = jwt.sign({ username }, process.env.JWT_SECRET!, {
    expiresIn: '2h',
  });

  res.status(200).json({
    message: '登录成功',
    token: token,
    user: {
      id: user._id,
      username: user.username,
      createdAt: user.createdAt,
    },
  });
}

async function getUserInfo(req: Request, res: Response) {
  try {
    const user = await User.findById(req.body.user?.id).select('-password'); // 不返回密码
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: '服务器错误' });
  }
}

export {
  registerUser,
  loginUser,
  getUserInfo
}
