// import RegisterForm from './Components/Onboard/RegisterForm';
import './App.css';
import {BrowserRouter as Router ,Routes, Route} from 'react-router-dom';
import LoginForm from './Components/Onboard/LoginForm';
import InventoryHomePage from './Components/Home/InventoryHomepage';
import DeliveryHomePage from './Components/Home/DeliveryHomepage';
import RegisterForm from './Components/Onboard/RegisterForm';
function App() {
  return (
    <div className="App">
        <Router>
        <Routes>
          <Route path='/' element={<RegisterForm/>}/>
          <Route path='/login' element={<LoginForm/>}/>
          <Route path='/inventory-home' element={<InventoryHomePage/>}/>
          <Route path='/delivery-home' element={<DeliveryHomePage/>}/>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
