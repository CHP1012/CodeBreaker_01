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
    // 슬롯 ID가 아직 설정되지 않았다면 광고를 호출하지 않음
    if (!adSlot || adSlot === "YOUR_AD_SLOT_ID") return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, [adSlot]);

  // 슬롯 ID가 설정되지 않았을 때의 시각적 피드백
  if (!adSlot || adSlot === "YOUR_AD_SLOT_ID") {
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-gray-100 border-2 border-dashed border-gray-300 min-h-[250px] text-center">
        <p className="text-[10px] text-gray-400 uppercase font-black mb-2">통신 보안 영역 (광고 단위 미설정)</p>
        <p className="text-[9px] text-gray-300 leading-tight">애드센스 슬롯 ID를 입력하면<br/>여기에 광고가 표시됩니다.</p>
      </div>
    );
  }

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