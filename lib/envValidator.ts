// Production environment validation
export interface EnvValidationResult {
  isValid: boolean;
  missingVars: string[];
  invalidVars: string[];
}

export class EnvValidator {
  private static REQUIRED_VARS = [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  ];

  private static RECOMMENDED_VARS = [
    'EXPO_PUBLIC_GEMINI_API_KEY',
    'EXPO_PUBLIC_FIRECRAWL_API_KEY',
    'EXPO_PUBLIC_AGORA_APP_ID',
  ];

  private static OPTIONAL_VARS = [
    'EXPO_PUBLIC_AGORA_TOKEN',
    'EXPO_PUBLIC_USE_EDGE_PROXY',
    'EXPO_PUBLIC_GEMINI_MODEL',
    'NODE_ENV',
    'DEBUG',
    'EXPO_PUBLIC_DEV_MODE',
    'EXPO_PUBLIC_CUSTOM_API_BASE_URL',
    'EXPO_PUBLIC_CUSTOM_WS_URL',
  ];

  static validateEnvironment(): EnvValidationResult {
    const missingVars: string[] = [];
    const invalidVars: string[] = [];

    // Check required variables
    for (const varName of this.REQUIRED_VARS) {
      const value = process.env[varName];
      
      if (!value) {
        missingVars.push(varName);
      } else if (this.isInvalidValue(varName, value)) {
        invalidVars.push(`${varName} (invalid format)`);
      }
    }

    // Check recommended variables (warn in logs only)
    for (const varName of this.RECOMMENDED_VARS) {
      const value = process.env[varName];
      if (value && this.isInvalidValue(varName, value)) {
        invalidVars.push(`${varName} (invalid format)`);
      }
    }

    // Check optional variables format
    for (const varName of this.OPTIONAL_VARS) {
      const value = process.env[varName];
      if (value && this.isInvalidValue(varName, value)) {
        invalidVars.push(`${varName} (invalid format)`);
      }
    }

    return {
      isValid: missingVars.length === 0 && invalidVars.length === 0,
      missingVars,
      invalidVars,
    };
  }

  private static isInvalidValue(varName: string, value: string): boolean {
    switch (varName) {
      case 'EXPO_PUBLIC_SUPABASE_URL':
        return !value.startsWith('https://') || !value.includes('.supabase.co');
      
      case 'EXPO_PUBLIC_SUPABASE_ANON_KEY':
        return value.length < 100 || !value.includes('.');
      
      case 'EXPO_PUBLIC_GEMINI_API_KEY':
        return value.length < 20;
      
      case 'EXPO_PUBLIC_FIRECRAWL_API_KEY':
        return value.length < 10;
      
      case 'EXPO_PUBLIC_AGORA_APP_ID':
        return !/^\d+$/.test(value);
      
      case 'EXPO_PUBLIC_AGORA_TOKEN':
        return value.length < 20;
      
      case 'NODE_ENV':
        return !['development', 'production', 'test'].includes(value);
      
      case 'DEBUG':
        return !['true', 'false', ''].includes(value);
      
      default:
        return false;
    }
  }

  static getEnvironmentInfo(): string {
    const validation = this.validateEnvironment();
    const nodeEnv = process.env.NODE_ENV || 'development';
    
    let info = `Environment: ${nodeEnv}\n`;
    
    if (validation.isValid) {
      info += '✅ All environment variables are valid\n';
    } else {
      info += '❌ Environment validation failed:\n';
      
      if (validation.missingVars.length > 0) {
        info += `Missing: ${validation.missingVars.join(', ')}\n`;
      }
      
      if (validation.invalidVars.length > 0) {
        info += `Invalid: ${validation.invalidVars.join(', ')}\n`;
      }
    }
    
    return info;
  }

  static validateAndThrow(): void {
    const validation = this.validateEnvironment();
    
    if (!validation.isValid) {
      const errorMessage = [
        'Environment validation failed:',
        ...validation.missingVars.map(v => `Missing: ${v}`),
        ...validation.invalidVars.map(v => `Invalid: ${v}`),
      ].join('\n');
      
      throw new Error(errorMessage);
    }
  }
}
