
import type { SVGProps } from 'react';

export function UpjLogo(props: SVGProps<SVGSVGElement>) {
  const { fill: propsFill, ...restProps } = props; // Destructure fill from props
  const primaryLogoColor = propsFill || "currentColor";

  // Heuristic to check if primaryLogoColor is effectively white.
  // This helps decide the color of the icon details for contrast.
  const isPrimaryColorEffectivelyWhite = () => {
    if (typeof primaryLogoColor !== 'string') return false;
    const lowerColor = primaryLogoColor.toLowerCase();
    return lowerColor === 'white' ||
           lowerColor === '#fff' ||
           lowerColor === '#ffffff' ||
           lowerColor === 'rgb(255,255,255)' ||
           lowerColor === 'rgba(255,255,255,1)';
  };

  // If the primary logo color is white (e.g., on splash screen), details are primary green.
  // Otherwise (e.g., logo is green on login page), details are white.
  const detailShapesFill = isPrimaryColorEffectivelyWhite() ? 'hsl(var(--primary))' : 'white';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 170 50" // Adjusted viewBox for aspect ratio
      aria-label="UPJ EventHub logo with icon on the left and stacked text 'UPJ EventHub' on the right"
      {...restProps} // Spread remaining props (like className, etc.), fill is handled internally now
    >
      {/* Icon Group: Positioned on the left, vertically centered */}
      <g transform="translate(5, 5)">
        {/* Main rounded rectangle for icon body - uses primaryLogoColor */}
        <rect x="0" y="0" width="40" height="40" rx="6" fill={primaryLogoColor}/>

        {/* Details - use detailShapesFill for contrast */}
        <circle cx="8" cy="8" r="2.5" fill={detailShapesFill} />
        <circle cx="13.5" cy="8" r="2.5" fill={detailShapesFill} />
        <circle cx="19" cy="8" r="2.5" fill={detailShapesFill} />
        <rect x="27" y="5.5" width="7" height="7" rx="1" fill={detailShapesFill} />
        <rect x="8" y="22" width="4.5" height="13" rx="1.5" fill={detailShapesFill} />
        <rect x="17.5" y="19" width="4.5" height="16" rx="1.5" fill={detailShapesFill} />
      </g>

      {/* Text part: "UPJ" and "EventHub" stacked. Positioned to the right of the icon. Uses primaryLogoColor */}
      <text
        x="55" // Start text after icon (icon width 40 + 5 offset + 10 space)
        y="17" // Y position for "UPJ"
        dominantBaseline="middle"
        textAnchor="start"
        fontFamily="Poppins, sans-serif"
        fontSize="17" // Font size for "UPJ"
        fontWeight="600"
        fill={primaryLogoColor}
      >
        UPJ
      </text>
      <text
        x="55" // Start text after icon
        y="35" // Y position for "EventHub" (below "UPJ")
        dominantBaseline="middle"
        textAnchor="start"
        fontFamily="Poppins, sans-serif"
        fontSize="17" // Font size for "EventHub"
        fontWeight="600"
        fill={primaryLogoColor}
      >
        EventHub
      </text>
    </svg>
  );
}
