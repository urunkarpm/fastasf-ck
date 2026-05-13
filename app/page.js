'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Pusher from 'pusher-js';
import { extractVideoId } from './lib/youtube';

function postSync(lobbyId, event, payload) {
  return fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lobbyId, event, payload }),
  });
}

export default function Home() {
  const [name, setName] = useState('');
  const [role, setRole] = useState('guest');
  const [lobbyId, setLobbyId] = useState('');
  const [joined, setJoined] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoId, setVideoId] = useState('');
  const [status, setStatus] = useState('Disconnected');
  const playerRef = useRef(null);

  const channelName = useMemo(() => (lobbyId ? `lobby-${lobbyId}` : null), [lobbyId]);

  useEffect(() => {
    if (!joined || !channelName) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });

    const channel = pusher.subscribe(channelName);
    setStatus('Connected');

    channel.bind('set-video', ({ videoId: incomingId }) => {
      setVideoId(incomingId || '');
    });

    channel.bind('play', () => {
      const iframe = playerRef.current;
      iframe?.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
    });

    channel.bind('pause', () => {
      const iframe = playerRef.current;
      iframe?.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
    });

    channel.bind('seek', ({ seconds }) => {
      const iframe = playerRef.current;
      iframe?.contentWindow?.postMessage(`{"event":"command","func":"seekTo","args":[${Math.max(0, Number(seconds) || 0)}, true]}`, '*');
    });

    return () => {
      pusher.unsubscribe(channelName);
      pusher.disconnect();
      setStatus('Disconnected');
    };
  }, [joined, channelName]);

  const onSetVideo = async () => {
    const id = extractVideoId(youtubeUrl);
    if (!id) return;
    setVideoId(id);
    await postSync(lobbyId, 'set-video', { videoId: id });
  };

  return (
    <main className="container grid">
      <h1>🎉 Party Mode YouTube Sync</h1>

      {!joined && (
        <section className="card grid">
          <input placeholder="Display name" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="Lobby ID (share this)" value={lobbyId} onChange={(e) => setLobbyId(e.target.value)} />
          <div className="controls">
            <button onClick={() => { setRole('host'); setJoined(true); }}>Join as host</button>
            <button className="secondary" onClick={() => { setRole('guest'); setJoined(true); }}>Join as guest</button>
          </div>
          <p className="small">Host controls are authoritative. Guests mirror host actions in near-real-time.</p>
        </section>
      )}

      {joined && (
        <>
          <section className="card grid">
            <p><strong>{name || 'Anonymous'}</strong> • {role.toUpperCase()} • Lobby: <code>{lobbyId}</code></p>
            <p className="small">Connection: {status}</p>

            {role === 'host' && (
              <>
                <input
                  placeholder="Paste YouTube URL or Video ID"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                />
                <div className="controls">
                  <button onClick={onSetVideo}>Set video</button>
                  <button onClick={() => postSync(lobbyId, 'play', {})}>Play</button>
                  <button onClick={() => postSync(lobbyId, 'pause', {})}>Pause</button>
                  <button onClick={() => postSync(lobbyId, 'seek', { seconds: 30 })}>Seek to 30s</button>
                  <button onClick={() => postSync(lobbyId, 'seek', { seconds: 60 })}>Seek to 60s</button>
                </div>
              </>
            )}
          </section>

          <section className="card">
            {videoId ? (
              <iframe
                ref={playerRef}
                title="YouTube Player"
                width="100%"
                height="480"
                src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&playsinline=1`}
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            ) : (
              <p>No video set yet. Waiting for host.</p>
            )}
          </section>
        </>
      )}
    </main>
  );
}
