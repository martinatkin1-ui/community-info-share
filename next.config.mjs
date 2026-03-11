/** @type {import('next').NextConfig} */

const securityHeaders = [
	{ key: "X-Content-Type-Options",    value: "nosniff" },
	{ key: "X-Frame-Options",           value: "SAMEORIGIN" },
	{ key: "X-XSS-Protection",          value: "1; mode=block" },
	{ key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
	{ key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig = {
	async headers() {
		return [
			{
				// Apply security headers to all routes
				source: "/:path*",
				headers: securityHeaders,
			},
		];
	},
};

export default nextConfig;
