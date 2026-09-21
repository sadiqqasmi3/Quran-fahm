import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Quran Feham",
    short_name: "Quran Feham",
    description:
      "Understand, read, recite, and complete the Quran together with Urdu as the first learning bridge.",
    start_url: "/home",
    display: "standalone",
    background_color: "#f7f4ec",
    theme_color: "#0e6549",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
