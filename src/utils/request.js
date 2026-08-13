import axios from "axios";

const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);

export const shouldRetryRequest = ({
  method = "get",
  status,
  hasResponse = true,
  attempt = 0,
  canceled = false,
}) =>
  !canceled &&
  method.toLowerCase() === "get" &&
  attempt < 2 &&
  (!hasResponse || RETRYABLE_STATUS.has(status));

export const isCanceledRequest = (error) =>
  axios.isCancel(error) || error?.code === "ERR_CANCELED";
