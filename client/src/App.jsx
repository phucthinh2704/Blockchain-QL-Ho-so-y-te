import { Route, Routes } from "react-router-dom";
import "./App.css";
import MedicalBlockchainApp from "./components/MedicalBlockchainApp ";
import LoginRegister from "./pages/Login";

function App() {
	return (
		<Routes>
			<Route
				path={`/login`}
				element={<LoginRegister />}
			/>
			<Route
				path={`/`}
				element={<MedicalBlockchainApp />}
			/>
		</Routes>
	);
}

export default App;
