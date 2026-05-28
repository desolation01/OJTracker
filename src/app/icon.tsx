import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 512,
  height: 512,
};

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 65%, #0ea5e9 100%)",
          color: "#f8fafc",
          fontSize: 220,
          fontWeight: 700,
          letterSpacing: -8,
        }}
      >
        OJ
      </div>
    ),
    size,
  );
}
