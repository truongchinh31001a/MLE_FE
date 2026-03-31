import { NextResponse } from "next/server";
import { buildCardioPayload, CARDIO_FORM_DEFAULTS } from "@/lib/cardio-model";
import { runCardioPredictor } from "@/lib/run-cardio-predictor";

export const runtime = "nodejs";

function getServerBaseUrl() {
  const configuredUrl = process.env.CARDIO_SERVER_URL?.trim();

  if (!configuredUrl) {
    return null;
  }

  return configuredUrl.replace(/\/+$/, "");
}

function buildServerUrl(pathname) {
  const baseUrl = getServerBaseUrl();
  return baseUrl ? `${baseUrl}${pathname}` : null;
}

async function readJsonSafely(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: "Prediction server tra ve du lieu khong phai JSON hop le.",
      error: text,
    };
  }
}

function buildProxyError(message, error) {
  return NextResponse.json(
    {
      message,
      error,
    },
    { status: 502 },
  );
}

export async function GET() {
  const serverUrl = getServerBaseUrl();

  return NextResponse.json({
    message: "Cardio prediction API is ready.",
    endpoint: "/api/predict",
    method: "POST",
    sample_input: CARDIO_FORM_DEFAULTS,
    mode: serverUrl ? "proxy" : "local-python",
    upstream: serverUrl ? buildServerUrl("/predict") : null,
  });
}

export async function POST(request) {
  try {
    const body = await request.json();

    const upstreamUrl = buildServerUrl("/predict");

    if (upstreamUrl) {
      try {
        const upstreamResponse = await fetch(upstreamUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify(body),
        });
        const upstreamPayload = await readJsonSafely(upstreamResponse);

        return NextResponse.json(upstreamPayload, {
          status: upstreamResponse.status,
        });
      } catch (error) {
        return buildProxyError(
          "Khong the ket noi toi prediction server rieng.",
          error.message,
        );
      }
    }

    const payload = buildCardioPayload(body);
    const prediction = await runCardioPredictor(payload);

    return NextResponse.json({
      ...prediction,
      input: payload,
    });
  } catch (error) {
    const isValidationError =
      error instanceof SyntaxError || Array.isArray(error.details);
    const status = isValidationError ? 400 : 500;

    return NextResponse.json(
      {
        message:
          status === 400
            ? error.message
            : "Khong the xu ly du doan luc nay.",
        details: error.details ?? null,
        error:
          status === 500 ? error.message : undefined,
      },
      { status },
    );
  }
}
