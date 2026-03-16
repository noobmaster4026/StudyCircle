import React, { useEffect, useRef } from "react";

const VideoGrid = ({ peers = [] }) => {
  const videoRefs = useRef([]);

  useEffect(() => {
    peers.forEach((peer, index) => {
      if (peer.stream && videoRefs.current[index]) {
        videoRefs.current[index].srcObject = peer.stream;
      }
    });
  }, [peers]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-900 h-[400px] overflow-y-auto rounded-lg shadow-inner">
      {peers.length > 0 ? (
        peers.map((peer, index) => (
          <video
            key={index}
            ref={(el) => (videoRefs.current[index] = el)}
            autoPlay
            playsInline
            muted={peer.isSelf} // mute self video
            className="w-full h-64 object-cover rounded-lg border-2 border-gray-700 shadow-md"
          />
        ))
      ) : (
        <div className="flex flex-col items-center justify-center col-span-full h-full text-gray-400">
          <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center">
            🎥
          </div>
          <p className="mt-4">Waiting for participants...</p>
        </div>
      )}
    </div>
  );
};

export default VideoGrid;
