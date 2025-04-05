const Authorization = (req, res, next) => {
    const token = req.headers['authorization'];
    if (token === process.env.TOKEN) {
        next();
    } else {
        res.status(401).json({ error: "Invalid token" });
    }
}

module.exports = Authorization;