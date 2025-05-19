import React from 'react';

import { BrowserRouter } from 'react-router-dom';

import Counter from './components/counter';
import GithubCorner from './components/github-corner';
import OmniCurrencyViewer from './components/viewer';

function App() {
  return (
    <BrowserRouter>
      <GithubCorner
        title='Get started on GitHub'
        url='https://github.com/doinel1a/vite-react-ts'
      />
      <OmniCurrencyViewer />
    </BrowserRouter>
  );
}

export default App;
