import "@/styles/globals.css";
import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { Providers } from "@/app/providers";
import clsx from "clsx";
import { Toaster } from "react-hot-toast";
import { AppWrapper } from "@/context";
import { LoadingWrapper } from "@/context/loading";
import MainLoading from "@/components/mainLoading";

export const metadata = {
	applicationName: siteConfig.name,
	title: {
		default: siteConfig.name,
		template: `%s - ${siteConfig.name}`,
	},
	description: siteConfig.description,
	manifest: "/manifest.json",

	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: siteConfig.name,
		// startUpImage: [],
	},
	formatDetection: {
		telephone: false,
	},
	openGraph: {
		type: "website",
		siteName: siteConfig.name,
		title: {
			default: siteConfig.name,
			template: siteConfig.name,
		},
		description: siteConfig.description,
	},
	twitter: {
		card: "summary",
		title: {
			default: siteConfig.name,
			template: siteConfig.name,
		},
		description: siteConfig.description,
	},

	icons: {
		icon: "/favicon.ico",
	},
};

export const viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "white" },
		{ media: "(prefers-color-scheme: dark)", color: "black" },
	],
}

export default function RootLayout({
	children
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head />
			<body
				className={clsx(
					"min-h-screen bg-background font-sans antialiased",
					fontSans.variable
				)}
			>
				<Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
					<AppWrapper>
						<LoadingWrapper>
							<MainLoading />
							{children}
						</LoadingWrapper>
					</AppWrapper>
				</Providers>
				<Toaster
					position="bottom-center"
					reverseOrder={false}
					gutter={8}
					containerClassName=""
					containerStyle={{}}
					toastOptions={{
						// Define default options
						className: '',
						duration: 5000,
						style: {
							background: '#363636',
							color: '#fff',
						},

						// Default options for specific types
						success: {
							duration: 3000,
							theme: {
								primary: 'green',
								secondary: 'black',
							},
						},
					}}
				/>
			</body>
		</html>
	);
}
