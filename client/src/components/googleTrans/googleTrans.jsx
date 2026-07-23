import { useEffect, useRef } from "react";
import { FaLanguage } from "react-icons/fa";
import { IoChevronDownSharp } from "react-icons/io5";

const GoogleTranslate = () => {
  const dropdownRef = useRef();

  useEffect(() => {
    const forceEnglishUI = () => {
      const googleLang = localStorage.getItem("googtrans");
      if (!googleLang || !googleLang.includes("/en")) {
        document.cookie = "googtrans=/en;path=/";
        localStorage.setItem("googtrans", "/en");
      }
    };

    const addGoogleTranslateScript = () => {
      if (document.getElementById("google-translate-script")) return;

      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src =
        "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      document.body.appendChild(script);

      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,ne,hi,fr,de,es,zh-CN,ja",
            layout: google.translate.TranslateElement.InlineLayout.VERTICAL,
            autoDisplay: false,
          },
          "google_translate_element"
        );
      };
    };

    forceEnglishUI();
    addGoogleTranslateScript();
  }, []);

  const toggleDropdown = () => {
    if (dropdownRef.current) {
      dropdownRef.current.classList.toggle("hidden");
    }
  };

  return (
    <div className="relative inline-block text-left z-50">
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-2 px-3 py-2 border shadow rounded-full text-sm text-[#4D4D4D] hover:bg-red-50 transition bg-white"
      >
        <FaLanguage className="text-red-500" size={16} />
        <span>Lang</span>
        <IoChevronDownSharp className="text-gray-500" size={16} />
      </button>

      <div
        ref={dropdownRef}
        className="absolute left-0 mt-2 bg-white border border-gray-300 shadow-lg rounded-md p-2 w-52 hidden"
      >
        <div id="google_translate_element" />
      </div>
    </div>
  );
};

export default GoogleTranslate;
