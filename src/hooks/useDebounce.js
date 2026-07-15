import { useEffect, useState } from "react";

// Returns `value` after it has stopped changing for `delay` ms. Used by the
// list pages so search inputs don't fire an API request on every keystroke.
const useDebounce = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};

export default useDebounce;
