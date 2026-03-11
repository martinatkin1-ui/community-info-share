export default function WMBanner() {
  return (
    <div className="w-full overflow-hidden select-none" aria-hidden="true">
      <svg
        viewBox="0 0 900 110"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full"
        preserveAspectRatio="xMidYMax slice"
      >
        {/* ── Atmospheric back row (depth / haze) ── */}
        <path
          fill="#E8C99A"
          opacity="0.35"
          d="M0,110 L0,78 L40,78 L40,70 L80,70 L80,78 L120,78 L120,65
             L160,65 L160,78 L200,78 L200,58 L260,58 L260,78 L320,78
             L320,62 L380,62 L380,78 L450,78 L450,52 L520,52 L520,78
             L580,78 L580,62 L640,62 L640,78 L700,78 L700,70 L760,70
             L760,78 L820,78 L820,65 L900,65 L900,110 Z"
        />

        {/* ── Victorian terraces + shops (left) ── */}
        <path
          fill="#2D3142"
          d="M0,110 L0,92
             L8,92  L8,88  L16,88 L16,84 L24,84 L24,88 L32,88 L32,92
             L40,92 L40,86 L48,86 L48,82 L56,82 L56,86 L64,86 L64,92
             L70,92 L70,84 L78,84 L78,80 L86,80 L86,84 L94,84 L94,92
             L100,92 L100,86 L108,86 L108,82 L116,82 L116,78 L124,78
             L124,82 L132,82 L132,86 L140,86 L140,92
             L146,92 L146,84 L154,84 L154,80 L162,80 L162,76 L170,76
             L170,80 L178,80 L178,84 L186,84 L186,92 L194,92
             L194,88 L199,88 L199,81 L205,78 L212,78 L218,81 L224,88
             L224,92 L232,92 L232,110"
        />

        {/* ── St Peter's Collegiate Church — tall Gothic spire ── */}
        <path
          fill="#2D3142"
          d="M236,110 L236,90
             L240,90 L240,85 L244,85 L244,78 L247,78
             L247,68 L250,68 L250,55 L252,55 L252,40
             L254,40 L254,26 L256,26 L256,16 L258,16
             L258,8  L260,8  L260,5
             L262,5  L262,8  L264,8  L264,16 L266,16
             L266,26 L268,26 L268,40 L270,40 L270,55
             L272,55 L272,68 L275,68 L275,78 L278,78
             L278,85 L282,85 L282,90 L286,90 L286,110"
        />

        {/* ── Buildings between spire and Civic Centre ── */}
        <path
          fill="#2D3142"
          d="M290,110 L290,92
             L298,92 L298,86 L308,86 L308,80 L318,80 L318,86 L328,86 L328,92
             L335,92 L335,84 L344,84 L344,78 L352,78 L352,84 L360,84 L360,92
             L366,92 L366,86 L374,86 L374,80 L384,80 L384,86 L392,86 L392,110"
        />

        {/* ── Wolverhampton Civic Centre — Art Deco stepped tower ── */}
        <path
          fill="#2D3142"
          d="M396,110 L396,88
             L404,88 L404,82 L414,82 L414,76 L422,76 L422,70
             L430,70 L430,64 L436,64 L436,57 L440,57 L440,50
             L444,50 L444,45 L448,45 L448,40 L452,40
             L452,44 L456,44 L456,48 L460,48 L460,54
             L464,54 L464,60 L468,60 L468,67 L474,67
             L474,73 L480,73 L480,79 L488,79 L488,85
             L496,85 L496,88 L504,88 L504,110"
        />

        {/* ── Post-war + modern office blocks (right) ── */}
        <path
          fill="#2D3142"
          d="M508,110 L508,92
             L516,92 L516,84 L528,84 L528,78 L542,78 L542,84 L554,84 L554,92
             L560,92 L560,86 L572,86 L572,78 L584,78 L584,86 L596,86 L596,92
             L602,92 L602,84 L614,84 L614,78 L628,78 L628,84 L640,84 L640,92
             L648,92 L648,86 L660,86 L660,90 L672,90 L672,92
             L680,92 L680,86 L692,86 L692,88 L706,88 L706,92
             L714,92 L714,86 L726,86 L726,90 L740,90 L740,92
             L748,92 L748,88 L762,88 L762,92
             L770,92 L770,86 L784,86 L784,90 L798,90 L798,92
             L808,92 L808,88 L824,88 L824,92 L840,92 L840,88
             L856,88 L856,92 L900,92 L900,110 L0,110 Z"
        />

        {/* ── Black Country chain strip (3 pairs of interlocked links) ── */}
        <g fill="none" stroke="#FF6B6B" strokeWidth="1.5" opacity="0.55">
          <ellipse cx="425" cy="106" rx="9" ry="4" />
          <ellipse cx="431" cy="106" rx="4" ry="8" />
          <ellipse cx="447" cy="106" rx="9" ry="4" />
          <ellipse cx="453" cy="106" rx="4" ry="8" />
          <ellipse cx="469" cy="106" rx="9" ry="4" />
          <ellipse cx="475" cy="106" rx="4" ry="8" />
        </g>

        {/* ── Accent glows ── */}
        {/* Spire finial */}
        <circle cx="260" cy="5" r="2.5" fill="#FF6B6B" opacity="0.85" />
        {/* Civic Centre crown */}
        <circle cx="452" cy="40" r="3"   fill="#FFB347" opacity="0.75" />
        {/* A warm window glow on the spire base */}
        <rect x="257" y="62" width="6" height="7" rx="3" fill="#FFB347" opacity="0.5" />
      </svg>
    </div>
  );
}
