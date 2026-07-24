"use strict";

// Handler del ranking. Corre en Lambda (Node 22). Usa el AWS SDK v3 que ya
// viene incluido en el runtime, asi no hace falta empaquetar dependencias.
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const TABLE = process.env.TABLE_NAME;
const MAX_SCORE = Number(process.env.MAX_SCORE || "1000000");
const MAX_LEADERBOARD = 50;

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

// Avatares validos (mismos que el juego). Cualquier otro cae a "mole".
const ALLOWED_AVATARS = new Set([
  "mole",
  "erizo",
  "helmet_mole",
  "disguise_mole",
  "bucket_mole",
  "fork_mole",
  "zombie_mole",
]);

function response(statusCode, body) {
  return { statusCode, headers: HEADERS, body: JSON.stringify(body) };
}

// Saneo del nombre del lado SERVIDOR (fuente de verdad, no confiar en el cliente):
// quita caracteres peligrosos para HTML y los ilegales del juego, colapsa
// espacios y recorta a 20. Aunque el cliente ya escapa al render, esto cierra
// el hueco para cualquier cliente falsificado que escriba directo a la API.
function sanitizeName(raw) {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/[<>&"'|*]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 20);
}

exports.handler = async (event) => {
  const method = event && event.requestContext && event.requestContext.http
    ? event.requestContext.http.method
    : undefined;

  try {
    if (method === "GET") return await getScores();
    if (method === "POST") return await submitScore(event);
    return response(405, { error: "Method Not Allowed" });
  } catch (err) {
    console.error("Handler error:", err);
    return response(500, { error: "Internal error" });
  }
};

async function getScores() {
  // Tabla chica (ranking): un Scan + orden en memoria es suficiente y simple.
  // Para escala grande se usaria un GSI con particion fija y score como sort key.
  const out = await ddb.send(new ScanCommand({ TableName: TABLE }));
  const scores = (out.Items || [])
    .map((it) => ({
      id: it.id,
      name: it.name,
      avatar: it.avatar,
      score: Number(it.score) || 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_LEADERBOARD);
  return response(200, { scores });
}

async function submitScore(event) {
  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return response(400, { error: "Invalid JSON" });
  }

  const id = typeof payload.id === "string" ? payload.id.slice(0, 64) : "";
  const name = sanitizeName(payload.name);
  const avatar = ALLOWED_AVATARS.has(payload.avatar) ? payload.avatar : "mole";
  let score = Math.floor(Number(payload.score));

  if (!id || !name) {
    return response(400, { error: "id y name son obligatorios" });
  }
  if (!Number.isFinite(score) || score < 0) {
    return response(400, { error: "score invalido" });
  }
  if (score > MAX_SCORE) score = MAX_SCORE; // acota anti-cheat

  // Escritura condicional: solo sube el score si el nuevo supera al guardado
  // (o si el jugador no existia). Esto elimina la condicion de carrera y evita
  // que un envio viejo pise un record mayor.
  try {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { id },
        UpdateExpression:
          "SET #n = :name, avatar = :avatar, #s = :score, updatedAt = :now",
        ConditionExpression: "attribute_not_exists(id) OR :score > #s",
        ExpressionAttributeNames: { "#n": "name", "#s": "score" },
        ExpressionAttributeValues: {
          ":name": name,
          ":avatar": avatar,
          ":score": score,
          ":now": new Date().toISOString(),
        },
      })
    );
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      // El score no supera el record: no es error. Igual refrescamos nombre/avatar
      // por si el jugador los cambio en su perfil.
      await ddb.send(
        new UpdateCommand({
          TableName: TABLE,
          Key: { id },
          UpdateExpression: "SET #n = :name, avatar = :avatar",
          ExpressionAttributeNames: { "#n": "name" },
          ExpressionAttributeValues: { ":name": name, ":avatar": avatar },
        })
      );
    } else {
      throw err;
    }
  }

  return response(200, { ok: true, name, avatar, score });
}
