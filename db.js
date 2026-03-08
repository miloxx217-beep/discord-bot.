db.run(`
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    money INTEGER DEFAULT 0,
    verified INTEGER DEFAULT 0
)
`);
