import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "ET Samanya Farms — A little earth. A lot of heart.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const bytes = await readFile(join(process.cwd(), "public/brand/lockup-ink.png"));
  const src = `data:image/png;base64,${Buffer.from(bytes).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#e8efd4",
          color: "#1a1c14",
          padding: 72,
        }}
      >
        <img alt="" src={src} width={420} height={97} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontSize: 22,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#6a7360",
            }}
          >
            {"A little earth. A lot of heart.".split(" ").map((word, index) => (
              <span key={`${word}-${index}`} style={{ marginRight: 12 }}>
                {word}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", marginTop: 16, fontSize: 36, color: "#3d4434" }}>
            {"Everyday food, grown among 1,600 trees.".split(" ").map((word, index) => (
              <span key={`${word}-${index}`} style={{ marginRight: 12 }}>
                {word}
              </span>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
