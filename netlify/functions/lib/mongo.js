"use strict";

const { MongoClient } = require("mongodb");

const {
  MONGODB_URI,
  DB_NAME = "cert_archive",
  COLLECTION_NAME = "certificates",
} = process.env;

let cachedClient;
let cachedDb;

async function connect() {
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI environment variable");
  }

  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  });

  await client.connect();
  const db = client.db(DB_NAME);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

async function getCertificatesCollection() {
  const { db } = await connect();
  return db.collection(COLLECTION_NAME);
}

module.exports = {
  getCertificatesCollection,
};

