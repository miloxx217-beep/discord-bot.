const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "database.sqlite");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS bank (
            userId TEXT PRIMARY KEY,
            pin TEXT NOT NULL,
            balance INTEGER NOT NULL DEFAULT 0
        )
    `);
});

function getUserAccount(userId) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM bank WHERE userId = ?", [userId], (err, row) => {
            if (err) return reject(err);
            resolve(row || null);
        });
    });
}

function createUserAccount(userId, pin) {
    return new Promise((resolve, reject) => {
        db.run(
            "INSERT INTO bank (userId, pin, balance) VALUES (?, ?, 0)",
            [userId, pin],
            function (err) {
                if (err) return reject(err);
                resolve();
            }
        );
    });
}

function updateBalance(userId, amountChange) {
    return new Promise((resolve, reject) => {
        db.run(
            "UPDATE bank SET balance = balance + ? WHERE userId = ?",
            [amountChange, userId],
            function (err) {
                if (err) return reject(err);
                resolve();
            }
        );
    });
}

module.exports = {
    getUserAccount,
    createUserAccount,
    updateBalance
};
