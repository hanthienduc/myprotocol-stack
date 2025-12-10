import { ImageResponse } from "next/og";
import { createClient } from "@myprotocolstack/database/server";

export const runtime = "edge";
export const alt = "Protocol Image";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ id: string }>;
}

const categoryGradients: Record<string, string> = {
  sleep: "linear-gradient(135deg, #4338ca 0%, #3730a3 50%, #312e81 100%)",
  focus: "linear-gradient(135deg, #d97706 0%, #b45309 50%, #92400e 100%)",
  energy: "linear-gradient(135deg, #ca8a04 0%, #a16207 50%, #854d0e 100%)",
  fitness: "linear-gradient(135deg, #16a34a 0%, #15803d 50%, #166534 100%)",
};

export default async function Image({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: protocol } = await supabase
    .from("protocols")
    .select("name, category, difficulty")
    .eq("id", id)
    .single();

  const name = protocol?.name || "Protocol";
  const category = protocol?.category || "sleep";
  const difficulty = protocol?.difficulty || "medium";
  const gradient =
    categoryGradients[category] ||
    "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: gradient,
          padding: 60,
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 32, color: "rgba(255,255,255,0.7)" }}>
            MyProtocolStack
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 56,
              fontWeight: "bold",
              color: "white",
              lineHeight: 1.2,
              maxWidth: "90%",
            }}
          >
            {name}
          </div>
          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: 24,
                color: "rgba(255,255,255,0.9)",
                textTransform: "capitalize",
                background: "rgba(255,255,255,0.2)",
                padding: "8px 16px",
                borderRadius: 8,
              }}
            >
              {category}
            </div>
            <div
              style={{
                fontSize: 24,
                color: "rgba(255,255,255,0.9)",
                textTransform: "capitalize",
                background: "rgba(255,255,255,0.2)",
                padding: "8px 16px",
                borderRadius: 8,
              }}
            >
              {difficulty}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 20, color: "rgba(255,255,255,0.6)" }}>
          Science-backed health optimization
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
