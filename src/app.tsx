import { BrowserRouter } from 'react-router-dom';

import OmniCurrencyViewer from './components/viewer';

function App() {
  return (
    <BrowserRouter>
      <OmniCurrencyViewer />
    </BrowserRouter>
  );
}

export default App;
