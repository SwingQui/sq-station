import { Outlet, Link, useLocation } from "react-router-dom";
import "./Layout.css";

function Layout() {
	const location = useLocation();

	return (
		<div className="app-layout">
			<nav className="navbar">
				<div className="nav-container">
					<Link to="/" className="nav-brand">
						SQ Station
					</Link>
					<ul className="nav-menu">
						<li className="nav-item">
							<Link
								to="/"
								className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
							>
								Home
							</Link>
						</li>
						<li className="nav-item">
							<Link
								to="/tool-box"
								className={`nav-link ${location.pathname === "/tool-box" ? "active" : ""}`}
							>
								Tool Box
							</Link>
						</li>
					</ul>
				</div>
			</nav>
			<main className="main-content">
				<Outlet />
			</main>
			<footer className="footer">
				<p>&copy; 2025 SQ Station. Powered by Cloudflare Workers.</p>
			</footer>
		</div>
	);
}

export default Layout;
