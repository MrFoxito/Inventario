import React, { useState } from 'react';
import { Smartphone } from 'lucide-react';
import Tilt from 'react-parallax-tilt';
import './DeviceImage.css';

export default function DeviceImage({ modelName, className = '', size = 40, premium = false }) {
  const [hasError, setHasError] = useState(false);
  
  // Converting to uppercase to avoid case-sensitivity issues on Vercel
  const safeModelName = modelName ? modelName.trim().toUpperCase() : '';

  const customStyle = size ? { width: size, height: size } : {};

  if (!safeModelName || hasError) {
    return (
      <div className={`device-image-fallback ${className}`} style={customStyle}>
        <Smartphone size={size ? size * 0.5 : 24} />
      </div>
    );
  }

  const imageSrc = `/terminals/${encodeURIComponent(safeModelName)}.png`;

  const ImageContent = () => (
    <>
      {premium && (
        <img
          src={imageSrc}
          alt=""
          className="device-img-glow"
          aria-hidden="true"
        />
      )}
      <img
        src={imageSrc}
        alt={safeModelName}
        className="device-img"
        onError={() => setHasError(true)}
        loading="lazy"
      />
    </>
  );

  if (premium) {
    return (
      <Tilt
        tiltMaxAngleX={15}
        tiltMaxAngleY={15}
        perspective={1000}
        scale={1.05}
        transitionSpeed={2000}
        gyroscope={true}
        className={`device-image-container premium-tilt ${className}`}
        style={customStyle}
      >
        <ImageContent />
      </Tilt>
    );
  }

  return (
    <div className={`device-image-container ${className}`} style={customStyle}>
      <ImageContent />
    </div>
  );
}
