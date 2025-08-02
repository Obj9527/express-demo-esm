import {User} from "../models/User.js";

export function sayHello(req, res) {
  res.json({ message: 'Hello from ESM Express!' });
}

export async function getUserInfo(req, res) {
  try {
    const user = await User.findById(req.body.user?.id).select('-password') // 不返回密码
    res.json(user)
  } catch (err) {
    res.status(500).json({msg: '服务器错误'})
  }
}
