import React from 'react';

import { BrowserRouter } from 'react-router-dom';

import Counter from './components/counter';
import GithubCorner from './components/github-corner';
import OmniCurrencyViewer from './components/viewer';

function App() {
  return (
    <BrowserRouter>
      <GithubCorner
        title='Visit 1delta'
        url='https://github.com/1delta-DAO/'
      />
      <OmniCurrencyViewer />
    </BrowserRouter>
  );
}

export default App;
