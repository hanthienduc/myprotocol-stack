import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MyProtocolStack";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          padding: 60,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: "bold",
            color: "white",
            marginBottom: 24,
          }}
        >
          MyProtocolStack
        </div>
        <div style={{ fontSize: 32, color: "#94a3b8", textAlign: "center" }}>
          Build and track science-backed health protocols
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
