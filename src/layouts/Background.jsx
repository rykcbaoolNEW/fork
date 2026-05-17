import clsx from "clsx";
import nav from "../styles/nav.module.css";
import theme from "../styles/theming.module.css";

import { useEffect } from "react";

useEffect(() => {
  const style = document.createElement("style");
  style.innerHTML = backgroundStyle;
  document.head.appendChild(style);

  return () => {
    document.head.removeChild(style);
  };
}, []);
