import { useState, useEffect } from "react";

interface SiteConfig {
	title?: string;
	[key: string]: any;
}

interface ConfigResponse {
	success: boolean;
	data?: SiteConfig;
	error?: string;
}

export function useConfig() {
	const [config, setConfig] = useState<SiteConfig>({ title: "SQ Station" });
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchConfig() {
			try {
				const response = await fetch("/api/kv/config?type=json");
				const data: ConfigResponse = await response.json();

				if (data.success && data.data) {
					setConfig(data.data);
				} else if (data.error) {
					console.error("Failed to load config:", data.error);
				}
			} catch (err) {
				console.error("Error fetching config:", err);
				setError(err instanceof Error ? err.message : "Unknown error");
			} finally {
				setLoading(false);
			}
		}

		fetchConfig();
	}, []);

	return { config, loading, error };
}
