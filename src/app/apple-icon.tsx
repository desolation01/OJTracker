import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 180,
  height: 180,
};

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #0f172a 0%, #1d4ed8 55%, #0ea5e9 100%)",
          borderRadius: 36,
          color: "#ffffff",
          fontSize: 72,
          fontWeight: 700,
          letterSpacing: -2,
        }}
      >
        OJ
      </div>
    ),
    size,
  );
}
