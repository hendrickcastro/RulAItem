'use client';

import { motion } from 'framer-motion';
import { signIn } from 'next-auth/react';
import { Github, Code, Brain, Zap, Shield, BarChart3 } from 'lucide-react';
import { Button } from './ui/button';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2"
          >
            <Brain className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">RulAItem</span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              onClick={() => signIn('github')}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Github className="h-4 w-4" />
              <span>Iniciar Sesión</span>
            </Button>
          </motion.div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-6xl font-bold text-gray-900 mb-6"
          >
            Análisis Inteligente de{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Código
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
          >
            Automatiza la documentación y análisis de tus repositorios con IA. 
            Obtén insights profundos sobre la calidad, complejidad y evolución de tu código.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
              size="lg"
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Github className="h-5 w-5" />
              <span>Comenzar con GitHub</span>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="flex items-center space-x-2"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Code className="h-5 w-5" />
              <span>Ver Características</span>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
          >
            Potencia tu Desarrollo
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Herramientas avanzadas para análisis, documentación y mejora continua de tu código
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mr-4">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
              </div>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Listo para revolucionar tu código?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Únete a miles de desarrolladores que ya usan RulAItem
          </p>
          <Button
            onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
            size="lg"
            variant="secondary"
            className="bg-white text-blue-600 hover:bg-gray-100"
          >
            Empezar Gratis
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Brain className="h-6 w-6" />
              <span className="text-lg font-semibold">RulAItem</span>
            </div>
            <div className="text-sm text-gray-400">
              © 2024 RulAItem. Desarrollado con ❤️ para la comunidad de desarrolladores.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: Brain,
    title: 'Análisis con IA',
    description: 'Análisis inteligente de código usando modelos de lenguaje avanzados para generar documentación automática.',
  },
  {
    icon: Code,
    title: 'Multi-Lenguaje',
    description: 'Soporte para JavaScript, TypeScript, Python, Java, Go, Rust y muchos más lenguajes de programación.',
  },
  {
    icon: BarChart3,
    title: 'Métricas Avanzadas',
    description: 'Métricas detalladas de complejidad, calidad de código y evolución temporal de tus proyectos.',
  },
  {
    icon: Zap,
    title: 'Tiempo Real',
    description: 'Análisis automático en cada commit con webhooks de GitHub, GitLab y Bitbucket.',
  },
  {
    icon: Shield,
    title: 'Seguridad',
    description: 'Detección de vulnerabilidades y patrones de seguridad en tu código automáticamente.',
  },
  {
    icon: Github,
    title: 'Integración Git',
    description: 'Integración nativa con GitHub para acceso directo a tus repositorios y análisis histórico.',
  },
];

const stats = [
  { value: '10K+', label: 'Repositorios Analizados' },
  { value: '50M+', label: 'Líneas de Código' },
  { value: '1K+', label: 'Desarrolladores Activos' },
  { value: '99.9%', label: 'Uptime' },
];