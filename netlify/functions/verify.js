"use strict";

const { getCertificatesCollection } = require("./lib/mongo");

const SAFE_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  const certificateId = event.queryStringParameters?.id;

  if (!certificateId) {
    return jsonResponse(400, { status: "error", message: "id query parameter is required" });
  }

  if (!SAFE_ID_PATTERN.test(certificateId)) {
    return jsonResponse(400, { status: "error", message: "invalid certificate id" });
  }

  try {
    const collection = await getCertificatesCollection();
    const certificate = await collection.findOne({ _id: certificateId });

    if (!certificate || !certificate.storageUrl) {
      return jsonResponse(404, { status: "not_found" });
    }

    return {
      statusCode: 302,
      headers: {
        Location: certificate.storageUrl,
        "cache-control": "no-store",
      },
      body: "",
    };
  } catch (error) {
    console.error("verify function error:", error);
    return jsonResponse(500, { status: "error", message: "internal server error" });
  }
};

