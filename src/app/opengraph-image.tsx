import { ImageResponse } from "next/og";

export const alt = "ET Samanya Farms — A little earth. A lot of heart.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          background: "#173022",
          color: "#f4ead8",
          padding: 72,
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 6, textTransform: "uppercase" }}>
          A little earth. A lot of heart.
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, lineHeight: 0.95, fontWeight: 500 }}>ET Samanya Farms</div>
          <div style={{ marginTop: 18, fontSize: 32, color: "#d9a441" }}>
            Everyday food, grown among 1,600 trees.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
