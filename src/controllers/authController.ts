import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import { BusinessError } from '../utils/error.js';
import { NextFunction, Request, Response } from 'express';
import { UserService } from 'services/UserService';
import { User } from 'models/User';

export async function registerUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { username, password } = req.body;
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

export async function loginUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { username, password } = req.body;

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
