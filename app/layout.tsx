import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Relatório Técnico de Serviços - Rarotec",
  description: "Sistema de geração de relatórios técnicos da Rarotec Tecnologia",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow-sm py-4 border-b border-gray-200">
              <div className="container mx-auto px-4 flex items-center">
                <img src="/img/logo.png" alt="Rarotec Tecnologia" className="h-10 mr-4" />
                <div>
                  <h1 className="text-xl font-bold text-gray-800">Sistema de Relatórios</h1>
                  <p className="text-sm text-gray-500">Rarotec Tecnologia</p>
                </div>
              </div>
            </header>
            {children}
            <footer className="bg-white border-t border-gray-200 py-4 mt-10">
              <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
                &copy; {new Date().getFullYear()} Rarotec Tecnologia. Todos os direitos reservados.
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
