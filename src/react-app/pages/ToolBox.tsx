import { useState } from "react";
import { Link } from "react-router-dom";
import "./ToolBox.css";

interface ToolConfig {
	id: string;
	name: string;
	description: string;
	category: "d1" | "kv" | "r2";
}

function ToolBox() {
	const [activeCategory, setActiveCategory] = useState<"all" | "d1" | "kv" | "r2">("all");

	const tools: ToolConfig[] = [
		{
			id: "d1-query",
			name: "D1 Query Editor",
			description: "Execute SQL queries on D1 database",
			category: "d1",
		},
		{
			id: "d1-schema",
			name: "D1 Schema Manager",
			description: "Manage database tables and schemas",
			category: "d1",
		},
		{
			id: "kv-browser",
			name: "KV Key Browser",
			description: "Browse and manage KV key-value pairs",
			category: "kv",
		},
		{
			id: "kv-editor",
			name: "KV Value Editor",
			description: "Edit and create KV entries",
			category: "kv",
		},
		{
			id: "r2-browser",
			name: "R2 File Browser",
			description: "Browse and manage R2 objects",
			category: "r2",
		},
		{
			id: "r2-uploader",
			name: "R2 File Uploader",
			description: "Upload files to R2 storage",
			category: "r2",
		},
	];

	const filteredTools =
		activeCategory === "all" ? tools : tools.filter((tool) => tool.category === activeCategory);

	return (
		<div className="tool-box-page">
			<header className="toolbox-header">
				<Link to="/" className="back-link">
					← Back to Home
				</Link>
				<h1>Tool Box</h1>
				<p>Manage your Cloudflare resources</p>
			</header>

			<main className="toolbox-content">
				<nav className="category-filter">
					<button
						className={`filter-btn ${activeCategory === "all" ? "active" : ""}`}
						onClick={() => setActiveCategory("all")}
					>
						All Tools
					</button>
					<button
						className={`filter-btn ${activeCategory === "d1" ? "active" : ""}`}
						onClick={() => setActiveCategory("d1")}
					>
						D1 Database
					</button>
					<button
						className={`filter-btn ${activeCategory === "kv" ? "active" : ""}`}
						onClick={() => setActiveCategory("kv")}
					>
						KV Storage
					</button>
					<button
						className={`filter-btn ${activeCategory === "r2" ? "active" : ""}`}
						onClick={() => setActiveCategory("r2")}
					>
						R2 Storage
					</button>
				</nav>

				<section className="tools-grid">
					{filteredTools.map((tool) => (
						<div key={tool.id} className="tool-card">
							<div className="tool-icon">{getToolIcon(tool.category)}</div>
							<h3>{tool.name}</h3>
							<p>{tool.description}</p>
							<button className="tool-launch-btn">Launch Tool</button>
						</div>
					))}
				</section>

				<section className="quick-actions">
					<h2>Quick Actions</h2>
					<div className="action-buttons">
						<button className="action-btn">Test API Connection</button>
						<button className="action-btn">View Usage Stats</button>
						<button className="action-btn">Clear Cache</button>
					</div>
				</section>
			</main>
		</div>
	);
}

function getToolIcon(category: string): string {
	switch (category) {
		case "d1":
			return "🗄️";
		case "kv":
			return "🔑";
		case "r2":
			return "📦";
		default:
			return "🔧";
	}
}

export default ToolBox;
