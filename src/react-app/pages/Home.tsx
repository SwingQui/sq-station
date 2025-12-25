import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
	return (
		<div className="home-page">
			<header className="hero">
				<h1>Welcome to SQ Station</h1>
				<p>Your Cloudflare-powered web application platform</p>
			</header>

			<main className="content">
				<section className="features">
					<h2>Features</h2>
					<div className="feature-grid">
						<div className="feature-card">
							<h3>D1 Database</h3>
							<p>SQLite-compatible database with global edge distribution</p>
						</div>
						<div className="feature-card">
							<h3>KV Storage</h3>
							<p>Fast, global key-value storage for your data</p>
						</div>
						<div className="feature-card">
							<h3>R2 Storage</h3>
							<p>S3-compatible object storage with zero egress fees</p>
						</div>
					</div>
				</section>

				<section className="cta">
					<h2>Get Started</h2>
					<div className="cta-buttons">
						<Link to="/tool-box" className="btn btn-primary">
							Open Tool Box
						</Link>
						<a
							href="https://developers.cloudflare.com/"
							target="_blank"
							rel="noopener noreferrer"
							className="btn btn-secondary"
						>
							Cloudflare Docs
						</a>
					</div>
				</section>
			</main>
		</div>
	);
}

export default Home;
