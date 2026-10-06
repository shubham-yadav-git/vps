import { useEffect, useRef, useState } from 'react';

/** An <img> that fades in once loaded instead of popping in. */
export default function FadeImage({ className = '', onError, ...props }) {
  const ref = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    // Images already in the browser cache may finish before React attaches onLoad
    if (ref.current?.complete && ref.current.naturalWidth) setLoaded(true);
  }, [props.src]);

  return (
    <img
      ref={ref}
      {...props}
      onLoad={() => setLoaded(true)}
      onError={onError}
      className={`transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
    />
  );
}
