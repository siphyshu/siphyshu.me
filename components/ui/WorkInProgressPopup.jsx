"use client";

import { useEffect } from "react";

const POPUP_TIMEOUT = 24 * 60 * 60 * 1000; // 1 day

export default function WorkInProgressPopup() {
  useEffect(() => {
    // show popup if last popup was shown more than 1 day ago
    const lastPopupTime = localStorage.getItem("lastPopupTime");
    if (
      !lastPopupTime ||
      Date.now() - parseInt(lastPopupTime) > POPUP_TIMEOUT
    ) {
      localStorage.setItem("lastPopupTime", Date.now().toString());
      showPopup();
      return;
    }
  }, []);

  // handle popup show/hide
  const showPopup = () => {
    const popup = document.getElementById("popup");
    if (popup) {
      popup.style.top = "16px";
    }
    setTimeout(() => {
      hidePopup();
    }, 3000);
  };
  const hidePopup = () => {
    const popup = document.getElementById("popup");
    if (popup) {
      popup.style.top = "-100%";
    }
  };

  return (
    <aside
      id="popup"
      className="fixed -top-full w-max font-serif text-black text-sm bg-red-50 bg-opacity-2 rounded-full py-2 px-4 border border-black cursor-pointer duration-500 ease-in-out transform transform-all"
      onClick={hidePopup}
    >
      <p>this site is a work-in-progress ⚠️</p>
    </aside>
  );
}
