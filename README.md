# Cardio Frontend

Frontend Next.js nay goi toi route `app/src/app/api/predict/route.js`.

Route do hoat dong theo 2 che do:

- Neu co `CARDIO_SERVER_URL`, no se proxy request sang prediction server rieng.
- Neu khong co `CARDIO_SERVER_URL`, no se fallback ve Python predictor local trong `app/scripts/predict_cardio.py`.

## Chay local

```bash
cd app
npm install
npm run dev
```

## Cau hinh prediction server rieng

Tao file `.env.local` trong thu muc `app/`:

```bash
CARDIO_SERVER_URL=http://localhost:8000
```

Sau do chay prediction server o thu muc `../server`.

## Deploy tach rieng

- Deploy `server/` nhu 1 FastAPI service doc lap.
- Deploy `app/` nhu frontend Next.js.
- Set bien moi truong `CARDIO_SERVER_URL` tren frontend thanh URL cua server da deploy.
