# AI Study Scheduler

The AI study scheduler is integrated into the active Express server and Vite client.

## User flow

Students open `/ai-schedule` from the student sidebar, select one or more enrolled courses, choose weekly hours and plan length, optionally add preferred study windows and deadlines, then generate a saved study plan.

## API

- `GET /api/ai-schedules`: returns saved schedules for the authenticated user.
- `POST /api/ai-schedules/generate`: validates schedule inputs, calls Gemini, stores the generated plan, and returns the saved schedule.

Both endpoints require `Authorization: Bearer <token>`.

## Environment

The server needs the existing `MONGO_URL` and `JWT_SECRET` values, plus:

- `GEMINI_API_KEY`: Google AI Studio API key.
- `GEMINI_MODEL`: optional override. If omitted, the controller tries Gemini flash model candidates in order.

## Files

- `server/routes/aiScheduleRoutes.js`
- `server/controllers/aiScheduleController.js`
- `server/models/AiStudySchedule.js`
- `client/src/pages/ai.jsx`
- `client/src/styles/ai.css`
- `server/tests/aiScheduleController.test.js`

## Checks

```bash
cd server
npm test

cd ../client
npm run build
```
