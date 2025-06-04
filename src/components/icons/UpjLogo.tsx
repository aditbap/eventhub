
import type { SVGProps } from 'react';

export function UpjLogo(props: SVGProps<SVGSVGElement>) {
  const iconAndTextFill = props.fill || "currentColor";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 160 50" // Aspect ratio approx 3.2:1
      aria-label="UPJ EventHub text with logo on the left side"
      {...props}
    >
      {/* Icon Group: Vertically centered (y=5 for height 40 in viewbox height 50) */}
      <g transform="translate(0, 5)" fill={iconAndTextFill}>
        {/* Main rounded rectangle for icon body */}
        <rect x="0" y="0" width="30" height="40" rx="6"/>
        
        {/* Three circles at top-left of icon body */}
        <circle cx="7" cy="8" r="1.8" />
        <circle cx="12" cy="8" r="1.8" />
        <circle cx="17" cy="8" r="1.8" />
        
        {/* Square at top-right of icon body */}
        <rect x="21" y="6" width="5" height="5" rx="1" />
        
        {/* Two vertical bars at bottom-center of icon body */}
        <rect x="7" y="20" width="4" height="15" rx="1.5" />
        <rect x="19" y="20" width="4" height="15" rx="1.5" />
      </g>
      
      {/* Text part: "UPJ EventHub" */}
      <text
        x="40" // Positioned after icon (width 30) + space (10)
        y="50%" // Vertically centered within SVG viewBox
        dominantBaseline="middle"
        textAnchor="start" 
        fontFamily="Poppins, sans-serif" // Using Poppins as per project's headline font
        fontSize="20" // Adjusted font size for balance
        fontWeight="600" // Semi-bold
        fill={iconAndTextFill}
      >
        UPJ EventHub
      </text>
    </svg>
  );
}
