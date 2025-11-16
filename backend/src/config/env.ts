import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  MONGO_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  CLIENT_URL: string;
  CLIENT_URLS: string[];
  API_URL: string;
  BCRYPT_SALT_ROUNDS: number;
}

class EnvValidator {
  private config: EnvConfig;

  constructor() {
    this.config = this.validate();
  }

  private validate(): EnvConfig {
    const errors: string[] = [];
    const isTest = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;

    const nodeEnv = process.env.NODE_ENV || 'development';
    if (!['development', 'production', 'test'].includes(nodeEnv)) {
      errors.push('NODE_ENV must be one of: development, production, test');
    }

    const port = parseInt(process.env.PORT || '4000', 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      errors.push('PORT must be a valid number between 1 and 65535');
    }

   let mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      if (isTest) {
        mongoURI = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/mini_competition_test';
      } else {
        errors.push('MONGO_URI is required');
      }
    } else if (!mongoURI.startsWith('mongodb://') && !mongoURI.startsWith('mongodb+srv://')) {
      errors.push('MONGO_URI must be a valid MongoDB connection string');
    }

    let jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      if (isTest) {
        jwtSecret = 'test-jwt-secret-key-minimum-32-characters-long-for-testing';
      } else {
        errors.push('JWT_SECRET is required');
      }
    } else if (jwtSecret.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long');
    } else if (nodeEnv === 'production' && jwtSecret === 'default_secret_change_in_production') {
      errors.push('JWT_SECRET must be changed from default value in production');
    }

    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const expiresInRegex = /^\d+[smhd]$/;
    if (!expiresInRegex.test(jwtExpiresIn)) {
      errors.push('JWT_EXPIRES_IN must be in format: number followed by s, m, h, or d (e.g., 7d, 24h)');
    }

    let clientUrls: string[] = [];
    if (process.env.CLIENT_URLS) {
      let urlsString = process.env.CLIENT_URLS.trim();
      if (urlsString.startsWith('[') && urlsString.endsWith(']')) {
        urlsString = urlsString.slice(1, -1);
      }
      clientUrls = urlsString
        .split(',')
        .map(url => url.trim().replace(/^["']|["']$/g, ''))
        .filter(url => url);
    } else if (process.env.CLIENT_URL) {
      let clientUrl = process.env.CLIENT_URL.trim();
      if (clientUrl.startsWith('[') && clientUrl.endsWith(']')) {
        clientUrl = clientUrl.slice(1, -1);
        clientUrls = clientUrl
          .split(',')
          .map(url => url.trim().replace(/^["']|["']$/g, ''))
          .filter(url => url);
      } else {
        clientUrls = [clientUrl];
      }
    } else {
      clientUrls = ['http://localhost:3000'];
    }
    
    for (const url of clientUrls) {
      try {
        new URL(url);
      } catch {
        errors.push(`Invalid client URL: ${url}`);
      }
    }
    
   const clientUrl = clientUrls[0] || 'http://localhost:3000';

    const apiUrl = process.env.API_URL || 'http://localhost:4000';
    try {
      new URL(apiUrl);
    } catch {
      errors.push('API_URL must be a valid URL');
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
    if (isNaN(saltRounds) || saltRounds < 10 || saltRounds > 15) {
      errors.push('BCRYPT_SALT_ROUNDS must be a number between 10 and 15');
    }

    if (errors.length > 0) {
      if (isTest) {
        console.warn('⚠️  Environment variable validation warnings (test mode):\n');
        errors.forEach((error) => console.warn(`  - ${error}`));
        console.warn('\nUsing default values for testing.\n');
      } else {
        console.error('❌ Environment variable validation failed:\n');
        errors.forEach((error) => console.error(`  - ${error}`));
        console.error('\nPlease check your .env file and ensure all required variables are set correctly.');
        process.exit(1);
      }
    }

    return {
      NODE_ENV: nodeEnv,
      PORT: port,
      MONGO_URI: mongoURI || 'mongodb://localhost:27017/mini_competition',
      JWT_SECRET: jwtSecret || 'default_secret_change_in_production',
      JWT_EXPIRES_IN: jwtExpiresIn,
      CLIENT_URL: clientUrl,
      CLIENT_URLS: clientUrls,
      API_URL: apiUrl,
      BCRYPT_SALT_ROUNDS: saltRounds,
    };
  }

  getConfig(): EnvConfig {
    return this.config;
  }

  isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  isTest(): boolean {
    return this.config.NODE_ENV === 'test';
  }
}

const envValidator = new EnvValidator();

export const env = envValidator.getConfig();

export const isProduction = () => envValidator.isProduction();
export const isDevelopment = () => envValidator.isDevelopment();
export const isTest = () => envValidator.isTest();

export default envValidator;

