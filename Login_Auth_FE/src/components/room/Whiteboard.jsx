import React, { useRef, useEffect, useState } from "react";

const Whiteboard = ({ socket, roomId }) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawingRef = useRef(false);

  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(2);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctxRef.current = ctx;

    // Receive drawings from others
    socket.on("draw", ({ x0, y0, x1, y1, color, brushSize }) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    });

    socket.on("clear-board", () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    return () => {
      socket.off("draw");
      socket.off("clear-board");
    };
  }, [socket]);

  const startDrawing = (e) => {
    drawingRef.current = true;
    ctxRef.current.lastX = e.nativeEvent.offsetX;
    ctxRef.current.lastY = e.nativeEvent.offsetY;
  };

  const draw = (e) => {
    if (!drawingRef.current) return;

    const x0 = ctxRef.current.lastX;
    const y0 = ctxRef.current.lastY;
    const x1 = e.nativeEvent.offsetX;
    const y1 = e.nativeEvent.offsetY;

    ctxRef.current.beginPath();
    ctxRef.current.strokeStyle = color;
    ctxRef.current.lineWidth = brushSize;
    ctxRef.current.moveTo(x0, y0);
    ctxRef.current.lineTo(x1, y1);
    ctxRef.current.stroke();

    socket.emit("draw", { roomId, x0, y0, x1, y1, color, brushSize });

    ctxRef.current.lastX = x1;
    ctxRef.current.lastY = y1;
  };

  const stopDrawing = () => {
    drawingRef.current = false;
  };

  const clearBoard = () => {
    const canvas = canvasRef.current;
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit("clear-board", roomId);
  };

  return (
    <div className="w-full mt-4">
      {/* Controls */}
      <div className="flex items-center gap-4 mb-2">
        <label className="flex items-center gap-2">
          🎨 Color:
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="cursor-pointer"
          />
        </label>
        <label className="flex items-center gap-2">
          ✏️ Brush:
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
          />
        </label>
        <button
          onClick={clearBoard}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded"
        >
          Clear
        </button>
      </div>

      {/* Whiteboard Canvas */}
      <canvas
        ref={canvasRef}
        className="border rounded shadow bg-white"
        style={{ width: "100%", height: "300px" }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  );
};

export default Whiteboard;
