import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {User} from "../models/User.js";
import logger from "../utils/logger.js";
import {BusinessError} from "../utils/error.js";

export async function registerUser(req, res, next) {
    const {username, password} = req.body;

    if (!username || !password) {
        throw new BusinessError('Username and password is required', 300310)
    }

    const exists = await User.findOne({ username });

    if (exists) {
        throw new BusinessError('User already exists', 300311)
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    logger.info(`用户注册成功：userId=${newUser.id}`)
    res.status(201).json({message: '注册成功'});
}

export async function loginUser(req, res) {
    const {username, password} = req.body;

    const user = await User.findOne({ username })
    if (!user) {
        return res.status(404).json({error: '用户不存在'});
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        return res.status(401).json({error: '密码错误'});
    }

    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.status(200).json({
        message: '登录成功',
        token: token,
        user: {
            id: user._id,
            username: user.username,
            createdAt: user.createdAt
        }
    });
}
