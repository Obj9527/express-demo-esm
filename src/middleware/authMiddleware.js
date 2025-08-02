import jwt from 'jsonwebtoken';

export function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // 格式: "Bearer token"

    if (!token) {
        return res.status(401).json({error: '未提供 token'});
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({error: 'Token 无效或已过期'});
        }
        next();
    });
}