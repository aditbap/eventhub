import type { SVGProps } from 'react';

export function UpjLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 50"
      width="150"
      height="37.5"
      aria-label="UPJ Event Hub Logo"
      {...props}
    >
      <rect width="200" height="50" fill="transparent" />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontFamily="Poppins, sans-serif"
        fontSize="28"
        fontWeight="bold"
        fill={props.fill || "white"}
      >
        UPJ EventHub
      </text>
    </svg>
  );
}
