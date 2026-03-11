import fs from "fs";
import path from "path";
import initSqlJs from "sql.js";

const dbPath = process.env.SQLITE_PATH || "./data.sqlite";
const schemaPath = new URL("../schema.sql", import.meta.url);

let db = null;

function persistDb() {
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

export async function initDb() {
  const SQL = await initSqlJs({
    locateFile: (file) =>
      path.resolve(new URL("../../node_modules/sql.js/dist/", import.meta.url).pathname, file)
  });

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(new Uint8Array(fileBuffer));
  } else {
    db = new SQL.Database();
  }

  const schema = fs.readFileSync(path.resolve(schemaPath.pathname), "utf-8");
  db.run(schema);
  persistDb();
}

export function run(sql, params = []) {
  db.run(sql, params);
  persistDb();
}

export function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

export function get(sql, params = []) {
  const rows = all(sql, params);
  return rows[0] || null;
}

export function transaction(work) {
  run("BEGIN");
  try {
    const result = work();
    run("COMMIT");
    return result;
  } catch (error) {
    run("ROLLBACK");
    throw error;
  }
}
