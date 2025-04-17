// src/components/Loader/TopLoader.jsx
import React, { forwardRef } from "react";
import LoadingBar from "react-top-loading-bar";

export default forwardRef((_, ref) => (
  <LoadingBar color="#29d" ref={ref} />
));
