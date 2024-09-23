import React, {
  createContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";

interface SearchResult {
  node: Node;
  startIndex: number;
  endIndex: number;
  elementIndex: number;
}

interface SearchReplaceContextProps {
  searchKeyword: string;
  replaceKeyword: string;
  setSearchKeyword: (keyword: string) => void;
  setReplaceKeyword: (keyword: string) => void;
  search: () => void;
  replace: () => void;
  navigate: (direction: "prev" | "next") => void;
  currentResultIndex: number;
  totalResults: number;
}

export const SearchReplaceContext = createContext<
  SearchReplaceContextProps | undefined
>(undefined);

export const SearchReplaceProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [replaceKeyword, setReplaceKeyword] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState<number>(-1);

  const search = useCallback(() => {
    if (!searchKeyword) return;

    const results: SearchResult[] = [];
    let elementIndex = 0;

    // 텍스트 노드 검색
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
    );

    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      if (node.parentElement?.closest(".no-search")) continue;

      const text = node.nodeValue;
      if (text && text.includes(searchKeyword)) {
        let startIndex = text.indexOf(searchKeyword);
        while (startIndex !== -1) {
          const endIndex = startIndex + searchKeyword.length;
          results.push({ node, startIndex, endIndex, elementIndex });
          startIndex = text.indexOf(searchKeyword, endIndex);
        }
      }
      elementIndex++;
    }

    // textarea, input 요소의 value 검색
    const inputs = document.querySelectorAll('textarea, input[type="text"]');
    inputs.forEach((input, index) => {
      const value = (input as HTMLInputElement).value || input.textContent;
      if (value) {
        let startIndex = value.indexOf(searchKeyword);
        while (startIndex !== -1) {
          const endIndex = startIndex + searchKeyword.length;
          results.push({
            node: input,
            startIndex,
            endIndex,
            elementIndex: elementIndex + index,
          });
          startIndex = value.indexOf(searchKeyword, endIndex);
        }
      }
    });

    // contenteditable 요소의 innerHTML 검색
    const editables = document.querySelectorAll('[contenteditable="true"]');
    editables.forEach((editable, index) => {
      const innerHTML = editable.innerHTML;
      let startIndex = innerHTML.indexOf(searchKeyword);
      while (startIndex !== -1) {
        const endIndex = startIndex + searchKeyword.length;
        results.push({
          node: editable,
          startIndex,
          endIndex,
          elementIndex: elementIndex + index,
        });
        startIndex = innerHTML.indexOf(searchKeyword, endIndex);
      }
    });

    setSearchResults(results);
    setCurrentResultIndex(results.length > 0 ? 0 : -1);
  }, [searchKeyword]);

  const replace = useCallback(() => {
    if (currentResultIndex === -1 || !replaceKeyword || !searchResults.length)
      return;

    const { node, startIndex, endIndex } = searchResults[currentResultIndex];

    if (
      node instanceof HTMLTextAreaElement ||
      node instanceof HTMLInputElement
    ) {
      // textarea, input 요소의 값 교체
      const value = node.value;
      const newValue =
        value.substring(0, startIndex) +
        replaceKeyword +
        value.substring(endIndex);
      node.value = newValue;
    } else if (node.nodeType === Node.TEXT_NODE) {
      // 텍스트 노드 교체
      const text = node.nodeValue;
      if (text) {
        const newText =
          text.substring(0, startIndex) +
          replaceKeyword +
          text.substring(endIndex);
        node.nodeValue = newText;
      }
    } else if (node instanceof HTMLElement && node.isContentEditable) {
      // contenteditable 요소의 innerHTML 교체
      const innerHTML = node.innerHTML;
      const newHTML =
        innerHTML.substring(0, startIndex) +
        replaceKeyword +
        innerHTML.substring(endIndex);
      node.innerHTML = newHTML;
    }

    search();
  }, [currentResultIndex, replaceKeyword, searchResults, search]);

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

      if (node.nodeType === Node.TEXT_NODE) {
        range.setStart(node, startIndex);
        range.setEnd(node, endIndex);
      } else if (node instanceof HTMLElement && node.isContentEditable) {
        const childNode = node.firstChild;
        if (childNode && childNode.nodeType === Node.TEXT_NODE) {
          range.setStart(childNode, startIndex);
          range.setEnd(childNode, endIndex);
        }
      }

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

  useEffect(() => {
    if (currentResultIndex !== -1 && searchResults.length > 0) {
      const { node, startIndex, endIndex } = searchResults[currentResultIndex];
      const range = document.createRange();
      const selection = window.getSelection();

      if (node.nodeType === Node.TEXT_NODE) {
        range.setStart(node, startIndex);
        range.setEnd(node, endIndex);
      } else if (node instanceof HTMLElement && node.isContentEditable) {
        const childNode = node.firstChild;
        if (childNode && childNode.nodeType === Node.TEXT_NODE) {
          range.setStart(childNode, startIndex);
          range.setEnd(childNode, endIndex);
        }
      }

      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      range.startContainer.parentElement?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentResultIndex, searchResults]);

  return (
    <SearchReplaceContext.Provider
      value={{
        searchKeyword,
        replaceKeyword,
        setSearchKeyword,
        setReplaceKeyword,
        search,
        replace,
        navigate,
        currentResultIndex,
        totalResults: searchResults.length,
      }}
    >
      {children}
    </SearchReplaceContext.Provider>
  );
};
