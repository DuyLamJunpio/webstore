import QRCode from "qrcode";

/**
 * Renders a QR payload as inline SVG, on the server.
 *
 * Server-side means the encoder never ships to the browser and the code is in
 * the HTML on first paint — a shopper with their banking app already open does
 * not wait for a hydration round trip. SVG rather than a PNG so it stays sharp
 * when someone zooms in to scan from an awkward angle.
 */
export default function QrCode({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  // "M" survives a bit of glare and a thumb over one corner
  const { modules } = QRCode.create(value, { errorCorrectionLevel: "M" });
  // the spec's 4-module quiet zone — scanners need the margin, not just the code
  const quiet = 4;
  const span = modules.size + quiet * 2;

  let path = "";
  for (let row = 0; row < modules.size; row++) {
    for (let col = 0; col < modules.size; col++) {
      if (modules.get(row, col)) path += `M${col + quiet} ${row + quiet}h1v1h-1z`;
    }
  }

  return (
    <svg
      viewBox={`0 0 ${span} ${span}`}
      role="img"
      aria-label={label}
      className={className}
      shapeRendering="crispEdges"
    >
      <rect width={span} height={span} fill="#ffffff" />
      <path d={path} fill="#1c1714" />
    </svg>
  );
}
