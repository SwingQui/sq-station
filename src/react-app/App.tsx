import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import ToolBox from "./pages/ToolBox";

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Layout />}>
					<Route index element={<Home />} />
					<Route path="tool-box" element={<ToolBox />} />
				</Route>
			</Routes>
		</BrowserRouter>
	);
}

export default App;
