import React from "react";
import { SearchReplaceContext } from "../context";

export const useSearchReplace = () => {
  const context = React.useContext(SearchReplaceContext);
  if (!context) {
    throw new Error(
      "useSearchReplace must be used within a SearchReplaceProvider",
    );
  }
  return context;
};
