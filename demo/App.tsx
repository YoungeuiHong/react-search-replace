import React from "react";
import { SearchReplaceProvider, useSearchReplace } from "../src";

const MyComponent = () => {
  const {
    searchKeyword,
    replaceKeyword,
    setSearchKeyword,
    setReplaceKeyword,
    search,
    replace,
    navigate,
    currentResultIndex,
    totalResults,
  } = useSearchReplace();

  return (
    <div>
      <div className="no-search">
        <h2>Search & Replace Example</h2>
        <label>Search Keyword: </label>
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="Enter search keyword"
        />
      </div>

      <div className="no-search">
        <label>Replace Keyword: </label>
        <input
          type="text"
          value={replaceKeyword}
          onChange={(e) => setReplaceKeyword(e.target.value)}
          placeholder="Enter replace keyword"
        />

        <button onClick={search}>Search</button>
        <button onClick={replace} disabled={currentResultIndex === -1}>
          Replace
        </button>
        <button onClick={() => navigate("prev")} disabled={totalResults <= 1}>
          Prev
        </button>
        <button onClick={() => navigate("next")} disabled={totalResults <= 1}>
          Next
        </button>

        {totalResults > 0 && (
          <p>
            Result {currentResultIndex + 1} of {totalResults}
          </p>
        )}
      </div>
      <h3>Input Field</h3>
      <input type="text" defaultValue="<참고> This is an input text." />

      <h3>Text Area</h3>
      <textarea defaultValue="This is a text area." rows={4} cols={50} />

      <h3>Table</h3>
      <table border={1}>
        <tbody>
          <tr>
            <td>Apple</td>
            <td>Banana</td>
            <td>Cherry</td>
          </tr>
          <tr>
            <td>Dog</td>
            <td>Elephant</td>
            <td>Fox</td>
          </tr>
        </tbody>
      </table>
      <div
        contentEditable="true"
        dangerouslySetInnerHTML={{
          __html: `<p><참고> Apple Banana Cherry</p>`,
        }}
      />
      <h5>Apple Banana Cherry</h5>
    </div>
  );
};

const App = () => (
  <SearchReplaceProvider>
    <MyComponent />
  </SearchReplaceProvider>
);

export default App;
