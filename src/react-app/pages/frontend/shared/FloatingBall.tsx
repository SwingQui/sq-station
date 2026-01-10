/**
 * 悬浮球组件（可复用）
 */

import type { FloatingBallProps } from "@/types/frontend/bookmarks";
import { defaultStyles } from "@/config/frontend/bookmarks.config";

export default function FloatingBall({
	onClick,
	styles: customStyles,
}: FloatingBallProps) {
	const styles = { ...defaultStyles, ...customStyles };

	return (
		<div
			onClick={onClick}
			style={{
				position: "fixed",
				bottom: "30px",
				right: "30px",
				width: "60px",
				height: "60px",
				background: `linear-gradient(135deg, ${styles.primaryColor} 0%, #764ba2 100%)`,
				borderRadius: "50%",
				boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
				cursor: "pointer",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				transition: "all 0.3s ease",
				zIndex: 9999,
				userSelect: "none",
			}}
			onMouseEnter={(e) => {
				e.currentTarget.style.transform = "scale(1.1)";
				e.currentTarget.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.6)";
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.transform = "scale(1)";
				e.currentTarget.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.4)";
			}}
			onMouseDown={(e) => {
				e.currentTarget.style.transform = "scale(0.95)";
			}}
			onMouseUp={(e) => {
				e.currentTarget.style.transform = "scale(1.1)";
			}}
		>
			{/* SVG 图标 */}
			<svg
				style={{
					width: "30px",
					height: "30px",
					fill: "white",
					transition: "transform 0.3s ease",
				}}
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
				onMouseEnter={(e) => {
					e.currentTarget.style.transform = "rotate(90deg)";
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.transform = "rotate(0deg)";
				}}
			>
				<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
			</svg>
		</div>
	);
}
