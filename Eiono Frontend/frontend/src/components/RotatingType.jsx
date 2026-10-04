import { useEffect, useState } from "react";

export default function RotatingType({ phrases }) {
  const [i, setI] = useState(0);
  const [txt, setTxt] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const full = phrases[i];
    let t;

    if (!deleting && txt === full) {
      // finished typing: hold, then start deleting
      t = setTimeout(() => setDeleting(true), 1600);
    } else if (deleting && txt === "") {
      // finished deleting: short pause, then move to next phrase
      t = setTimeout(() => {
        setDeleting(false);
        setI((prev) => (prev + 1) % phrases.length);
      }, 300);
    } else {
      t = setTimeout(
        () =>
          setTxt(
            deleting
              ? full.slice(0, txt.length - 1)
              : full.slice(0, txt.length + 1)
          ),
        deleting ? 25 : 55
      );
    }

    return () => clearTimeout(t);
  }, [txt, deleting, i, phrases]);

  return (
    <span className="rotating">
      {txt}
      <span className="caret" />
    </span>
  );
}