import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { GitBranch, Zap, Shield, BarChart3 } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            KONTEXTO IA
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Sistema inteligente de análisis y documentación de código con IA. 
            Automatiza la generación de contexto y documentación técnica para repositorios de software.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/signin">
              <Button size="lg" className="px-8 py-3">
                Comenzar Ahora
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg" className="px-8 py-3">
                Ver Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <GitBranch className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Análisis Git</h3>
            <p className="text-gray-600">
              Análisis automático de commits, diffs y estructura de código
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Zap className="h-12 w-12 text-yellow-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">IA Avanzada</h3>
            <p className="text-gray-600">
              Generación inteligente de documentación con LLM
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Shield className="h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Seguro</h3>
            <p className="text-gray-600">
              Autenticación OAuth y manejo seguro de repositorios
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <BarChart3 className="h-12 w-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Métricas</h3>
            <p className="text-gray-600">
              Visualización de métricas y análisis de código
            </p>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold text-center mb-8">Stack Tecnológico</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Frontend</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Next.js 14+ (App Router)</li>
                <li>• TypeScript</li>
                <li>• Tailwind CSS</li>
                <li>• Framer Motion</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Backend</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Node.js + Express</li>
                <li>• Firestore</li>
                <li>• Redis</li>
                <li>• Auth.js</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Análisis</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Tree-sitter</li>
                <li>• OpenAI API</li>
                <li>• BullMQ</li>
                <li>• Docker</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
