import React, {
  ReactNode,
  useRef,
  useContext,
  createContext,
  useCallback,
  useState,
} from "react";

interface SearchResult {
  node: Text;
  startIndex: number;
  endIndex: number;
}

interface SearchReplaceBoundaryContextProps {
  searchResults: SearchResult[];
  currentResultIndex: number;
  search: (searchKeyword: string) => void;
  replace: (replaceKeyword: string) => void;
  navigate: (direction: "prev" | "next") => void;
}

const SearchReplaceBoundaryContext = createContext<
  SearchReplaceBoundaryContextProps | undefined
>(undefined);

export const SearchReplaceBoundary = ({
  children,
}: {
  children: ReactNode;
}) => {
  const boundaryRef = useRef<HTMLDivElement>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState<number>(-1);

  const search = useCallback((searchKeyword: string) => {
    if (!searchKeyword || !boundaryRef.current) return;

    const results: SearchResult[] = [];
    const walker = document.createTreeWalker(
      boundaryRef.current,
      NodeFilter.SHOW_TEXT,
      null,
    );

    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      const text = node.nodeValue;
      if (text && text.includes(searchKeyword)) {
        let startIndex = text.indexOf(searchKeyword);
        while (startIndex !== -1) {
          const endIndex = startIndex + searchKeyword.length;
          results.push({ node, startIndex, endIndex });
          startIndex = text.indexOf(searchKeyword, endIndex);
        }
      }
    }

    setSearchResults(results);
    setCurrentResultIndex(results.length > 0 ? 0 : -1);
  }, []);

  const replace = useCallback(
    (replaceKeyword: string) => {
      if (currentResultIndex === -1 || !replaceKeyword || !searchResults.length)
        return;

      const { node, startIndex, endIndex } = searchResults[currentResultIndex];
      const text = node.nodeValue;
      if (text) {
        const newText =
          text.substring(0, startIndex) +
          replaceKeyword +
          text.substring(endIndex);
        node.nodeValue = newText;
        search(newText); // 치환 후 검색 결과 갱신
      }
    },
    [currentResultIndex, searchResults, search],
  );

  const navigate = useCallback(
    (direction: "prev" | "next") => {
      if (!searchResults.length) return;

      let newIndex = currentResultIndex;
      if (direction === "prev") {
        newIndex =
          currentResultIndex > 0
            ? currentResultIndex - 1
            : searchResults.length - 1;
      } else if (direction === "next") {
        newIndex =
          currentResultIndex < searchResults.length - 1
            ? currentResultIndex + 1
            : 0;
      }

      setCurrentResultIndex(newIndex);

      const range = document.createRange();
      const selection = window.getSelection();
      const { node, startIndex, endIndex } = searchResults[newIndex];

      range.setStart(node, startIndex);
      range.setEnd(node, endIndex);

      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      range.startContainer.parentElement?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    },
    [currentResultIndex, searchResults],
  );

  return (
    <SearchReplaceBoundaryContext.Provider
      value={{ searchResults, currentResultIndex, search, replace, navigate }}
    >
      <div ref={boundaryRef}>{children}</div>
    </SearchReplaceBoundaryContext.Provider>
  );
};

export const useSearchReplaceBoundary = () => {
  const context = useContext(SearchReplaceBoundaryContext);
  if (!context) {
    throw new Error(
      "useSearchReplaceBoundary must be used within a SearchReplaceBoundary",
    );
  }
  return context;
};
