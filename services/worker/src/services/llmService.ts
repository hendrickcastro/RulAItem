import OpenAI from 'openai';
import { logger } from '../utils/logger';

interface DocumentationInput {
  diff: any;
  parsedFiles: any[];
  context: any;
}

export class LLMService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
  }

  async generateDocumentation(input: DocumentationInput): Promise<string> {
    try {
      const prompt = this.buildPrompt(input);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en documentación de código. Genera documentación clara y concisa en español para los cambios de código proporcionados.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      });

      const documentation = response.choices[0]?.message?.content || '';
      logger.info('Documentation generated successfully');
      return documentation;

    } catch (error) {
      logger.error('Failed to generate documentation:', error);
      throw new Error(`Failed to generate documentation: ${error.message}`);
    }
  }

  private buildPrompt(input: DocumentationInput): string {
    const { diff, parsedFiles, context } = input;

    let prompt = `# Análisis de Commit\n\n`;
    prompt += `**Commit:** ${diff.sha}\n`;
    prompt += `**Mensaje:** ${diff.message}\n`;
    prompt += `**Autor:** ${diff.author.name} (${diff.author.email})\n\n`;

    // Add context if available
    if (context.packageJson) {
      prompt += `## Contexto del Proyecto\n`;
      prompt += `**Nombre:** ${context.packageJson.name}\n`;
      prompt += `**Descripción:** ${context.packageJson.description || 'N/A'}\n\n`;
    }

    // Add file changes
    prompt += `## Archivos Modificados\n`;
    for (const file of diff.modifiedFiles) {
      prompt += `- **${file.path}**: +${file.additions} -${file.deletions}\n`;
    }
    prompt += `\n`;

    // Add parsed code analysis
    if (parsedFiles.length > 0) {
      prompt += `## Análisis de Código\n`;
      for (const file of parsedFiles) {
        prompt += `### ${file.path}\n`;
        prompt += `**Lenguaje:** ${file.language}\n`;
        
        if (file.functions && file.functions.length > 0) {
          prompt += `**Funciones:**\n`;
          file.functions.forEach(func => {
            prompt += `- ${func.name}(${func.params.join(', ')}) - Línea ${func.line}\n`;
          });
        }
        
        if (file.classes && file.classes.length > 0) {
          prompt += `**Clases:**\n`;
          file.classes.forEach(cls => {
            prompt += `- ${cls.name} - Línea ${cls.line}\n`;
          });
        }
        prompt += `\n`;
      }
    }

    prompt += `## Estadísticas\n`;
    prompt += `- **Total de archivos:** ${diff.stats.total}\n`;
    prompt += `- **Líneas añadidas:** ${diff.stats.additions}\n`;
    prompt += `- **Líneas eliminadas:** ${diff.stats.deletions}\n\n`;

    prompt += `Por favor, genera una documentación que incluya:\n`;
    prompt += `1. **Resumen:** Descripción breve de los cambios\n`;
    prompt += `2. **Impacto:** Qué componentes se ven afectados\n`;
    prompt += `3. **Detalles técnicos:** Explicación de los cambios más importantes\n`;
    prompt += `4. **Consideraciones:** Posibles efectos o recomendaciones\n`;

    return prompt;
  }
}
