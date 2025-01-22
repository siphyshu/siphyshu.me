"use client";
import Image from "next/image";
import HandprintCanvas from "@/components/HandprintCanvas";
import HandprintCanvasDev from "@/components/HandprintCanvasDev";
import LinkPanel from "@/components/LinkPanel";
import WorkInProgressPopup from "@/components/WorkInProgressPopup";

export default function Home() {
  return (
    <>
      <main className="flex font-serif flex-col min-h-screen w-screen bg-white text-black items-center px-4">
        <WorkInProgressPopup />
        <div className="text-center mt-52">
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
        <HandprintCanvasDev />
        {/* <HandprintCanvas /> */}
      </main>
    </>
  );
}
