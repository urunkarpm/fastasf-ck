import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  useTLS: true,
});

export async function POST(req) {
  const body = await req.json();
  const { lobbyId, event, payload } = body;

  if (!lobbyId || !event) {
    return Response.json({ error: 'lobbyId and event are required' }, { status: 400 });
  }

  await pusher.trigger(`lobby-${lobbyId}`, event, payload || {});
  return Response.json({ ok: true });
}
