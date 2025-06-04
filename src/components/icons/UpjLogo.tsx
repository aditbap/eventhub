
import type { SVGProps } from 'react';

export interface UpjLogoProps extends SVGProps<SVGSVGElement> {
  iconOnly?: boolean;
}

export function UpjLogo(props: UpjLogoProps) {
  const { fill: propsFill, iconOnly = false, className, ...restProps } = props;
  const primaryLogoColor = propsFill || "currentColor";

  const isPrimaryColorEffectivelyWhite = () => {
    if (typeof primaryLogoColor !== 'string') return false;
    const lowerColor = primaryLogoColor.toLowerCase();
    return lowerColor === 'white' ||
           lowerColor === '#fff' ||
           lowerColor === '#ffffff' ||
           lowerColor === 'rgb(255,255,255)' ||
           lowerColor === 'rgba(255,255,255,1)';
  };

  const detailShapesFill = isPrimaryColorEffectivelyWhite() ? 'hsl(var(--primary))' : 'white';

  if (iconOnly) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 40 40" // ViewBox specifically for the 40x40 icon
        aria-label="UPJ EventHub Icon"
        className={className}
        {...restProps}
      >
        {/* Icon itself, filling the 40x40 viewBox */}
        <rect x="0" y="0" width="40" height="40" rx="6" fill={primaryLogoColor}/>
        {/* Details, positioned within the 40x40 icon box */}
        <circle cx="8" cy="8" r="2.5" fill={detailShapesFill} />
        <circle cx="13.5" cy="8" r="2.5" fill={detailShapesFill} />
        <circle cx="19" cy="8" r="2.5" fill={detailShapesFill} />
        <rect x="27" y="5.5" width="7" height="7" rx="1" fill={detailShapesFill} />
        <rect x="8" y="22" width="4.5" height="13" rx="1.5" fill={detailShapesFill} />
        <rect x="17.5" y="19" width="4.5" height="16" rx="1.5" fill={detailShapesFill} />
      </svg>
    );
  }

  // Full logo (icon + text)
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 170 50" // Original viewBox for icon + text
      aria-label="UPJ EventHub logo with icon on the left and stacked text 'UPJ EventHub' on the right"
      className={className}
      {...restProps}
    >
      {/* Icon Group: Positioned on the left, needs to be within the 0-170 width of viewBox */}
      <g transform="translate(5, 5)"> {/* This transform is relative to the 0,0 of the SVG itself */}
        <rect x="0" y="0" width="40" height="40" rx="6" fill={primaryLogoColor}/>
        <circle cx="8" cy="8" r="2.5" fill={detailShapesFill} />
        <circle cx="13.5" cy="8" r="2.5" fill={detailShapesFill} />
        <circle cx="19" cy="8" r="2.5" fill={detailShapesFill} />
        <rect x="27" y="5.5" width="7" height="7" rx="1" fill={detailShapesFill} />
        <rect x="8" y="22" width="4.5" height="13" rx="1.5" fill={detailShapesFill} />
        <rect x="17.5" y="19" width="4.5" height="16" rx="1.5" fill={detailShapesFill} />
      </g>

      {/* Text part: "UPJ" and "EventHub" stacked. Positioned to the right of the icon. */}
      <text
        x="55" // Adjusted to be to the right of the icon group
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
        x="55" // Adjusted to be to the right of the icon group
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
