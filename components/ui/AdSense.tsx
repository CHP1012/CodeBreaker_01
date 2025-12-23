import React, { useEffect } from 'react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface Props {
  adSlot: string; // 애드센스 대시보드에서 생성한 슬롯 번호
  adFormat?: string;
  className?: string;
}

export const AdSense: React.FC<Props> = ({ adSlot, adFormat = "auto", className = "" }) => {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);

  return (
    <div className={`adsense-container ${className}`} style={{ minWidth: '250px', minHeight: '100px' }}>
      <ins className="adsbygoogle"
           style={{ display: 'block' }}
           data-ad-client="ca-pub-7103811440269576"
           data-ad-slot={adSlot}
           data-ad-format={adFormat}
           data-full-width-responsive="true"></ins>
    </div>
  );
};