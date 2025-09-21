import express from "express";

import config from "./configManager.js";

const app = express();
app.use(express.json());

/**
 * key = gateId, value = ts (ms)
 * @type {Map<number, number>}
 */
const lastCallTs = new Map();
const lastGateTs = new Map();

/**
 * Simple fetch with timeout
 * @param {string} url URL to fetch
 * @param {RequestInit} options fetch options
 * @param timeoutMs
 * @return {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {...options, signal: controller.signal});
  } catch (error) {
    console.error(error);
  } finally {
    clearTimeout(id);
  }
}

function rateLimit(gateId) {
  const t = lastGateTs.get(gateId) || 0;

  if ((Date.now() - t) / 1000 < config.MIN_INTERVAL_SEC) {
    return false;
  }

  lastGateTs.set(gateId, Date.now());
  return true;
}

async function callPhone(host, gateId) {
  const url = `http://${host}:${config.PHONE_PORT}/${config.PHONE_PATH_SALT}/gate/${gateId}/open`;
  const body = JSON.stringify({token: config.PHONE_TOKEN});
  const t0 = performance.now();

  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body
  }, config.PHONE_TIMEOUT_MS);

  if (!res) {
    return {ok: false, status: 'timeout'};
  }

  const rttMs = Math.round(performance.now() - t0);

  const text = await res.text().catch((err) => console.error('[callPhone] Error while encoding response', err));

  return {ok: res.ok, status: res.status, text, rttMs};
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/gates/:gateId/open", async (req, res) => {
  try {
    if (req.get("X-API-Key") !== config.API_KEY) {
      return res.status(401).json({error: "Unauthorized"});
    }

    const gateId = Number(req.params.gateId);
    if (![1, 2, 3, 4].includes(gateId)) {
      return res.status(400).json({error: "Unknown gate_id"});
    }

    if (!rateLimit(gateId)) {
      return res.status(429).json({error: "Too Many Requests for this gate"});
    }

    const phoneResp = await callPhone(config.PHONE_HOST, gateId);

    if (!phoneResp) {
      return res.status(502).json({error: `Phone returned nothing`});
    }

    if (!phoneResp.ok) {
      return res.status(502).json({error: `Phone returned ${phoneResp.status}`, body: phoneResp.text});
    }

    return res.json({status: "ok"});
  } catch (err) {
    const msg = err?.name === "AbortError" ? "Phone timeout" : String(err);
    return res.status(502).json({error: `Phone bridge error: ${msg}`});
  }
});

app.listen(config.APP_PORT, "0.0.0.0", () => {
  console.log(`GateBridge listening on http://0.0.0.0:${config.APP_PORT}`);
});
