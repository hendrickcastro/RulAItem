import { OpenAI } from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';

interface LLMResponse {
  summary: string;
  patterns: string[];
  suggestions: string[];
  concerns: string[];
}

export class LLMService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private provider: 'openai' | 'anthropic' = 'openai';
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize OpenAI if API key is available
      if (process.env.OPENAI_API_KEY) {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        this.provider = 'openai';
        logger.info('✅ OpenAI initialized');
      }

      // Initialize Anthropic if API key is available (fallback)
      if (!this.openai && process.env.ANTHROPIC_API_KEY) {
        this.anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });
        this.provider = 'anthropic';
        logger.info('✅ Anthropic initialized');
      }

      if (!this.openai && !this.anthropic) {
        throw new Error('No LLM provider configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY');
      }

      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize LLM service:', error);
      throw error;
    }
  }

  async analyze(prompt: string): Promise<LLMResponse> {
    if (!this.isInitialized) {
      throw new Error('LLM service not initialized');
    }

    try {
      if (this.provider === 'openai' && this.openai) {
        return await this.analyzeWithOpenAI(prompt);
      } else if (this.provider === 'anthropic' && this.anthropic) {
        return await this.analyzeWithAnthropic(prompt);
      }

      throw new Error('No LLM provider available');
    } catch (error) {
      logger.error('LLM analysis failed:', error);
      
      // Return fallback response
      return {
        summary: 'Analysis unavailable due to LLM service error',
        patterns: [],
        suggestions: ['Review code changes manually', 'Consider adding tests'],
        concerns: ['LLM analysis service temporarily unavailable'],
      };
    }
  }

  private async analyzeWithOpenAI(prompt: string): Promise<LLMResponse> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized');
    }

    const model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
    
    const response = await this.openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are an expert code reviewer and software architect. 
          Analyze code changes and provide concise, actionable insights. 
          Always respond with valid JSON in the specified format.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    try {
      const parsed = JSON.parse(content);
      return this.validateLLMResponse(parsed);
    } catch (parseError) {
      logger.error('Failed to parse OpenAI response:', parseError);
      throw new Error('Invalid JSON response from OpenAI');
    }
  }

  private async analyzeWithAnthropic(prompt: string): Promise<LLMResponse> {
    if (!this.anthropic) {
      throw new Error('Anthropic not initialized');
    }

    const response = await this.anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1500,
      temperature: 0.3,
      system: `You are an expert code reviewer and software architect. 
      Analyze code changes and provide concise, actionable insights. 
      Always respond with valid JSON in the specified format.`,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic');
    }

    try {
      const parsed = JSON.parse(content.text);
      return this.validateLLMResponse(parsed);
    } catch (parseError) {
      logger.error('Failed to parse Anthropic response:', parseError);
      throw new Error('Invalid JSON response from Anthropic');
    }
  }

  private validateLLMResponse(response: any): LLMResponse {
    return {
      summary: response.summary || 'No summary provided',
      patterns: Array.isArray(response.patterns) ? response.patterns : [],
      suggestions: Array.isArray(response.suggestions) ? response.suggestions : [],
      concerns: Array.isArray(response.concerns) ? response.concerns : [],
    };
  }

  async generateDocumentation(codeAnalysis: any): Promise<{
    overview: string;
    apiDocs: string[];
    examples: string[];
    architecture: string;
  }> {
    const prompt = this.buildDocumentationPrompt(codeAnalysis);
    
    try {
      if (this.provider === 'openai' && this.openai) {
        const response = await this.openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `You are a technical documentation expert. 
              Generate comprehensive, clear documentation from code analysis. 
              Focus on practical usage and architectural insights.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.4,
          max_tokens: 2000,
        });

        const content = response.choices[0]?.message?.content;
        return this.parseDocumentationResponse(content || '');
      }

      // Fallback response
      return {
        overview: 'Documentation generation unavailable',
        apiDocs: [],
        examples: [],
        architecture: 'Architecture analysis unavailable',
      };

    } catch (error) {
      logger.error('Documentation generation failed:', error);
      return {
        overview: 'Documentation generation failed',
        apiDocs: [],
        examples: [],
        architecture: 'Architecture analysis failed',
      };
    }
  }

  private buildDocumentationPrompt(codeAnalysis: any): string {
    return `
Generate comprehensive documentation for the following codebase analysis:

**Repository Metrics:**
- Total files: ${codeAnalysis.totalFiles}
- Total lines of code: ${codeAnalysis.totalLinesOfCode}
- Languages: ${Object.keys(codeAnalysis.languageBreakdown || {}).join(', ')}
- Complexity score: ${codeAnalysis.complexityScore}

**Functions and Classes:**
${codeAnalysis.functions ? `- Functions: ${codeAnalysis.functions.length}` : ''}
${codeAnalysis.classes ? `- Classes: ${codeAnalysis.classes.length}` : ''}

Please provide:
1. **Overview**: A high-level description of the codebase purpose and structure
2. **API Documentation**: Key functions and classes with their purposes
3. **Usage Examples**: Code snippets showing how to use main components
4. **Architecture**: Description of the overall system architecture and patterns

Format your response clearly with markdown sections.
    `.trim();
  }

  private parseDocumentationResponse(response: string): {
    overview: string;
    apiDocs: string[];
    examples: string[];
    architecture: string;
  } {
    // Simple parsing - in production, you might want more sophisticated parsing
    const sections = response.split('##');
    
    return {
      overview: this.extractSection(sections, 'overview') || 'Overview not available',
      apiDocs: [this.extractSection(sections, 'api') || 'API documentation not available'],
      examples: [this.extractSection(sections, 'example') || 'Examples not available'],
      architecture: this.extractSection(sections, 'architecture') || 'Architecture description not available',
    };
  }

  private extractSection(sections: string[], keyword: string): string | null {
    const section = sections.find(s => 
      s.toLowerCase().includes(keyword.toLowerCase())
    );
    
    return section ? section.trim() : null;
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down LLM service...');
    
    // Clean up any pending requests or connections if needed
    this.openai = null;
    this.anthropic = null;
    this.isInitialized = false;

    logger.info('✅ LLM service shutdown complete');
  }

  isReady(): boolean {
    return this.isInitialized && (this.openai !== null || this.anthropic !== null);
  }
}