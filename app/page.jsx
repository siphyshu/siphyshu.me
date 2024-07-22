"use client";
import Image from "next/image";
import HandprintCanvas from "@/components/HandprintCanvas";
import LinkPanel from "@/components/LinkPanel";
import WorkInProgressPopup from "@/components/WorkInProgressPopup";

export default function Home() {
  return (
    <>
      <main className="flex font-serif flex-col h-screen w-screen bg-white text-black items-center justify-center px-4 pt-52">
        <WorkInProgressPopup />
        <div className="text-center">
          <p className="text-2xl mb-4">hey, i'm jaiyank!</p>
          <Image
            src="/images/siphyshu.png"
            alt="siphyshu"
            width={120}
            height={120}
            priority={true}
            className="mx-auto mb-4"
          />
          <div className="text-base mb-4">
            20 y/o{" "}
            <Image
              src="/images/india.png"
              alt="India flag"
              width={20}
              height={20}
              className="inline h-auto"
            />・exploring CS @ VITB
          </div>
          <LinkPanel />
        </div>
        <HandprintCanvas />
      </main>
    </>
  );
}
