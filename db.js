const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "database.sqlite");
const db = new sqlite3.Database(dbPath);

// Tworzenie tabel
db.serialize(() => {
    // BANK
    db.run(`
        CREATE TABLE IF NOT EXISTS bank (
            userId TEXT PRIMARY KEY,
            pin TEXT NOT NULL,
            balance INTEGER NOT NULL DEFAULT 0
        )
    `);

    // DOWODY
    db.run(`
        CREATE TABLE IF NOT EXISTS dowody (
            userId TEXT PRIMARY KEY,
            imie TEXT,
            nazwisko TEXT,
            plec TEXT,
            obywatelstwo TEXT,
            numer INTEGER
        )
    `);

    // PRAWO JAZDY
    db.run(`
        CREATE TABLE IF NOT EXISTS prawko (
            userId TEXT,
            kategoria TEXT,
            PRIMARY KEY (userId, kategoria)
        )
    `);

    // SKLEP (logi zakupów)
    db.run(`
        CREATE TABLE IF NOT EXISTS sklep_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId TEXT,
            produkt TEXT,
            cena INTEGER,
            data TEXT
        )
    `);

    // KANTOR (logi)
    db.run(`
        CREATE TABLE IF NOT EXISTS kantor_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId TEXT,
            kwota INTEGER,
            data TEXT
        )
    `);
});

// BANK
function getUserAccount(userId) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM bank WHERE userId = ?", [userId], (err, row) => {
            if (err) reject(err);
            else resolve(row || null);
        });
    });
}

function createUserAccount(userId, pin) {
    return new Promise((resolve, reject) => {
        db.run("INSERT INTO bank (userId, pin, balance) VALUES (?, ?, 0)", [userId, pin], err => {
            if (err) reject(err);
            else resolve();
        });
    });
}

function updateBalance(userId, amount) {
    return new Promise((resolve, reject) => {
        db.run("UPDATE bank SET balance = balance + ? WHERE userId = ?", [amount, userId], err => {
            if (err) reject(err);
            else resolve();
        });
    });
}

// DOWODY
function createDowod(userId, imie, nazwisko, plec, obywatelstwo, numer) {
    return new Promise((resolve, reject) => {
        db.run(
            "INSERT INTO dowody (userId, imie, nazwisko, plec, obywatelstwo, numer) VALUES (?, ?, ?, ?, ?, ?)",
            [userId, imie, nazwisko, plec, obywatelstwo, numer],
            err => err ? reject(err) : resolve()
        );
    });
}

function hasDowod(userId) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM dowody WHERE userId = ?", [userId], (err, row) => {
            if (err) reject(err);
            else resolve(!!row);
        });
    });
}

// PRAWO JAZDY
function addPrawko(userId, kategoria) {
    return new Promise((resolve, reject) => {
        db.run(
            "INSERT OR IGNORE INTO prawko (userId, kategoria) VALUES (?, ?)",
            [userId, kategoria],
            err => err ? reject(err) : resolve()
        );
    });
}

function hasPrawko(userId, kategoria) {
    return new Promise((resolve, reject) => {
        db.get(
            "SELECT * FROM prawko WHERE userId = ? AND kategoria = ?",
            [userId, kategoria],
            (err, row) => err ? reject(err) : resolve(!!row)
        );
    });
}

module.exports = {
    db,
    getUserAccount,
    createUserAccount,
    updateBalance,
    createDowod,
    hasDowod,
    addPrawko,
    hasPrawko
};

