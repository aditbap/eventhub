
import type { SVGProps } from 'react';

export function UpjLogo(props: SVGProps<SVGSVGElement>) {
  const iconAndTextFill = props.fill || "currentColor";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 170 50" // Adjusted viewBox for aspect ratio
      aria-label="UPJ EventHub logo with icon on the left and stacked text 'UPJ EventHub' on the right"
      {...props}
    >
      {/* Icon Group: Positioned on the left, vertically centered */}
      <g transform="translate(5, 5)" fill={iconAndTextFill}>
        {/* Main rounded rectangle for icon body */}
        <rect x="0" y="0" width="40" height="40" rx="6"/>
        
        {/* Three circles at top-left of icon body */}
        <circle cx="8" cy="8" r="2.5" />
        <circle cx="13.5" cy="8" r="2.5" />
        <circle cx="19" cy="8" r="2.5" />
        
        {/* Square at top-right of icon body */}
        <rect x="27" y="5.5" width="7" height="7" rx="1" />
        
        {/* Two vertical bars at bottom of icon body */}
        {/* Left bar: shorter, thinner */}
        <rect x="8" y="22" width="4.5" height="13" rx="1.5" />
        {/* Right bar: taller, thicker */}
        <rect x="17.5" y="19" width="4.5" height="16" rx="1.5" />
      </g>
      
      {/* Text part: "UPJ" and "EventHub" stacked. Positioned to the right of the icon. */}
      <text
        x="55" // Start text after icon (icon width 40 + 5 offset + 10 space)
        y="17" // Y position for "UPJ"
        dominantBaseline="middle"
        textAnchor="start" 
        fontFamily="Poppins, sans-serif"
        fontSize="17" // Font size for "UPJ"
        fontWeight="600"
        fill={iconAndTextFill}
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
        fill={iconAndTextFill}
      >
        EventHub
      </text>
    </svg>
  );
}
