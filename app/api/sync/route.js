import Pusher from 'pusher';

function getPusherServer() {
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    return null;
  }

  return new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });
}

export async function POST(req) {
  const body = await req.json();
  const { lobbyId, event, payload } = body;

  if (!lobbyId || !event) {
    return Response.json({ error: 'lobbyId and event are required' }, { status: 400 });
  }

  const pusher = getPusherServer();
  if (!pusher) {
    return Response.json({ error: 'Missing realtime server config' }, { status: 500 });
  }

  await pusher.trigger(`lobby-${lobbyId}`, event, payload || {});
  return Response.json({ ok: true });
}
